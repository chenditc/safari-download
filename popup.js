// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */

function renderStatus() {
  var statusText = "Downloaded " + download_count.toString() + "/" + expected_download_count.toString(); 
  if (download_count == expected_download_count ) {
    var button = document.getElementById('download-button');
    button.disabled = false;
    statusText = "All Done"
  }
  document.getElementById('status').textContent = statusText;
}

function setBookName(bookName) {
  document.getElementById('book-name').textContent = bookName;
}

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

function saveUrl(url, file_name) {
  // Create new tab, wait until it is loaded and save the page
  chrome.tabs.create({
    url: url,
    active : false
  }, function(tab) {
    chrome.tabs.onUpdated.addListener(function func(tabId, changeInfo) {
        if (tabId == tab.id && changeInfo.status == 'complete') {
            chrome.tabs.onUpdated.removeListener(func);
            // Save page blob
            function saveMhtml(mhtml){
              saveAs(mhtml, file_name + '.mhtml');
              chrome.tabs.remove(tabId);
              download_count++;
              renderStatus();
            }
            chrome.pageCapture.saveAsMHTML({ tabId: tab.id }, saveMhtml);
        }
    });
  });
}



function getBookNameFromUrl(book_url) {
    var re = new RegExp('https://www.safaribooksonline.com/library/view/(\.+)/\\d+/\.*');
    var book_name = re.exec(book_url)[1];
    return book_name
}

function downloadButtonCallback(tabId) {
    function downloadBook(name_url_map_json) {
        console.log("Received name_url_map_json:")
        console.log(name_url_map_json);
        name_url_map = JSON.parse(name_url_map_json);

        for (var name in name_url_map) {
            console.log(name_url_map[name]);
            saveUrl(name_url_map[name], name);
            expected_download_count++;
        }
    }
    var button = document.getElementById('download-button');
    button.disabled = true;
    chrome.tabs.sendMessage(tabId, {text: 'get_name_url_map'}, downloadBook);
}

var download_count = 0;
var expected_download_count = 0;

document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('download-button');
  button.disabled = true;

  getCurrentTab(function(tab) {
    var book_name = getBookNameFromUrl(tab.url);
    setBookName(book_name);

    // Inject content script and button callback
    chrome.tabs.executeScript(null, {file: "content.js"});

    var button = document.getElementById('download-button');
    button.disabled = false;
    button.addEventListener('click', function() {
      downloadButtonCallback(tab.id);
    });
  })
});


