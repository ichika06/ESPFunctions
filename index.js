const {onSchedule} = require("firebase-functions/v2/scheduler");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp({
  databaseURL: "https://nextgen-pemss-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

// Set the global options for the region
setGlobalOptions({region: "asia-southeast1"});

exports.checkDeviceStatus = onSchedule("* * * * *", async (event) => {
  const devices = [
    "PEMSS_Admin_1",
    "Esp32_client1",
    "PEMSS_Client_2",
    "PEMSS_Client_3",
  ];
  const thresholdSeconds = 15; // Consider offline if no update in 15 seconds

  for (const device of devices) {
    const devicePath = `/${device}/last_seen`;
    const statusPath = `/${device}/status`;
    try {
      const snapshot = await admin.database().ref(devicePath).once("value");
      const lastSeen = snapshot.val();
      const now = Math.floor(Date.now() / 1000);

      // Do NOT update last_seen here, only check it
      if (lastSeen && now - lastSeen < thresholdSeconds) {
        // Device is online: update status
        await admin.database().ref(statusPath).set("online");
        console.log({device, status: "online", last_seen: lastSeen});
      } else {
        // Device is offline: update status only
        await admin.database().ref(statusPath).set("offline");
        console.log({device, status: "offline", last_seen: lastSeen});
      }
    } catch (error) {
      console.error(`Error checking ${device}:`, error);
    }
  }
});
