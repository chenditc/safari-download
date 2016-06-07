console.log("Injecting safari book download extension");

function getBookNameFromUrl(book_url) {
    var re = new RegExp('\.*/library/view/(\.+)/\\d+/\.*');
    var book_name = re.exec(book_url)[1];
    return book_name
}

function removeHashTag(book_url) {
    hash_index = book_url.indexOf("#");
    if (hash_index > 0) {
        return book_url.substring(0, hash_index);
    }
    return book_url;
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg);
    // If the received message has the expected format...
    if (msg.text === 'get_url_name_map') {
        var chapter_count = 0;
        function getNextChapterNum() {
          function zeroPad(num, places) {
            var zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
          }
          var chapter_number = zeroPad(chapter_count++, 3); 
          return chapter_number;
        }

        // Get all chapter name and their url
        var url_name_map = {};

        // Get chapter list
        var tocList = document.getElementsByClassName("detail-toc")[0];
        tocList = tocList.getElementsByTagName("li");

        for (var i = 0; i < tocList.length; i++) {
          // Get hyperlinks to each chapter
          var chapter_dom_list = tocList[i].getElementsByTagName("a");
          for(var j = 0; j < chapter_dom_list.length; j++) {
              chapter_dom = chapter_dom_list[j]
              var chapter_url = "https://www.safaribooksonline.com/" + chapter_dom.getAttribute("href");
              chapter_url = removeHashTag(chapter_url)
              if (url_name_map[chapter_url] == undefined) {
                var book_name = getBookNameFromUrl(chapter_url);
                var chapter_number = getNextChapterNum();
                url_name_map[chapter_url] = book_name + "-ch" + chapter_number 
              } 
          }
        }
        url_name_map_json = JSON.stringify(url_name_map);
        sendResponse(url_name_map_json);
    }
});
