// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 *      UI Modifier
 */
function renderStatus(statusText) {
  if (statusText == undefined) { 
    var statusText = "I'm working, please do not change tab or close me.\n" + "Downloaded " + download_count.toString() + "/" + expected_download_count.toString(); 
    if (download_count == expected_download_count && download_count > 0) {
      var button = document.getElementById('download-button');
      button.disabled = false;
      statusText = "All Done"
    }
  }
  document.getElementById('status').textContent = statusText;
}

function setBookName(bookName) {
  document.getElementById('book-name').textContent = bookName;
}

/*
 *      Chrome utility wrapper
 */

function getCurrentTab(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    callback(tab);
  });
}

function createTabInBackground(url, callback) {
  // Create new tab, wait until it is loaded and save the page
  chrome.tabs.create({
    url: url,
    active : false
  }, function(tab) {
    chrome.tabs.onUpdated.addListener(function func(tabId, changeInfo) {
        if (tabId == tab.id && changeInfo.status == 'complete') {
            chrome.tabs.onUpdated.removeListener(func);
            callback(tab.id);
        }
    });
  });

}



function getBookNameFromUrl(book_url) {
    var re = new RegExp('https://www.safaribooksonline.com/library/view/(\.+)/\\d+/\.*');
    var book_match = re.exec(book_url);
    if (book_match == null) {
        return null;
    }
    var book_name = book_match[1];
    return book_name
}

function saveUrls(url_name_map) {
  // Termination condition, when url_name_map is empty
  var keys = Object.keys(url_name_map)
  if ( keys.length == 0) {
    return
  }
  var url = keys[0];
  var file_name = url_name_map[url];
  delete url_name_map[url];

  // Use promise to ensure one tab will finish download before next tab starts
  // This can save memory on low memory machine
  var promise = new Promise(
    function(resolve, reject) {
      createTabInBackground(url, 
        function saveTab(tabId) {
          chrome.pageCapture.saveAsMHTML({ tabId: tabId }, 
            // Save page blob
            function saveMhtml(mhtml){
              saveAs(mhtml, file_name + '.mhtml');
              chrome.tabs.remove(tabId);
              download_count++;
              renderStatus();
              // Finish current download job, 
              // Resolve and pass the map to next iteration
              resolve(url_name_map);
            }
          );
        }
      ); 
    }
  );
  promise.then(saveUrls);
}

function downloadButtonCallback(chapter_list_url) {
    var button = document.getElementById('download-button');
    button.disabled = true;
    renderStatus();

    createTabInBackground(chapter_list_url, function (tabId) {
      function downloadBook(url_name_map_json) {
        console.log("Received url_name_map_json:")
        console.log(url_name_map_json);
        chrome.tabs.remove(tabId);

        url_name_map = JSON.parse(url_name_map_json);

        expected_download_count += Object.keys(url_name_map).length;
        renderStatus();

        saveUrls(url_name_map);
      }

      chrome.tabs.sendMessage(tabId, {text: 'get_url_name_map'}, downloadBook);

    })
}

var download_count = 0;
var expected_download_count = 0;

document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('download-button');
  button.disabled = true;

  getCurrentTab(function(tab) {
    var book_name = getBookNameFromUrl(tab.url);
    if (book_name == null) {
        setBookName("Unable to get book name, please change another url and try again")
        return;
    }
    else {
        setBookName(book_name);
    }

    // Inject content script and button callback
    chrome.tabs.executeScript(null, {file: "content.js"});

    var button = document.getElementById('download-button');
    button.disabled = false;
    button.addEventListener('click', function() {
      tab_url = tab.url;
      var re = new RegExp('(\.+://www.safaribooksonline.com/library/view/\.+/\\d+/)\.*');
      var match = re.exec(tab_url)
      if (match != null) {
        book_url = match[1] + "#toc"
        downloadButtonCallback(book_url);
      }
      else {
        renderStatus("Unknown url, not able to get book chapter url")
      }
    });
  })
});


