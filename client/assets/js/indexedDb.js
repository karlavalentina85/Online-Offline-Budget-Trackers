let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
  var db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    writeOfflineRecordsToDatabase();
  }
};

request.onerror = function(event) {
  console.log("Error! " + event.target.errorCode);
};

function saveRecord(record) {
  var transaction = db.transaction(["pending"], "readwrite");
  var store = transaction.objectStore("pending");
  store.add(record);
}

function writeOfflineRecordsToDatabase() {

  var transaction = db.transaction(["pending"], "readwrite");
  var store = transaction.objectStore("pending");
  var getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        var transaction = db.transaction(["pending"], "readwrite");
        var store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

window.addEventListener("online", writeOfflineRecordsToDatabase());
