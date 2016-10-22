# safari-download
chrome extension to help download safari books online from http://www.safaribooksonline.com/

## Prerequisites
1. You need to have a valid Safari Books Online account which can be used to browse all chapters of a book.
2. This extension only works for domain http://www.safaribooksonline.com/.

## Install
### Option 1
1. Open [Chrome Extension Install](https://chrome.google.com/webstore/detail/safari-books-download/anlpljppoinmpaedoilhjibjehpjhcob?hl=en-US&gl=US)
2. Click "Add to chrome" button.

### Option 2
1. Download crx file [Chrome Extension Package Download](https://github.com/chenditc/safari-download/blob/master/chrome-extension.crx?raw=true)
2. Open url: "chrome://extensions/" in chrome
3. Drag the crx file to "chrome://extensions/" page

## Usage
1. When you are reading a book on safaribooksonline.com, and you want to download it. 
 - Eg. https://www.safaribooksonline.com/library/view/site-reliability-engineering/9781491929117/ch01.html#idm140203539211104
2. You can click the extension icon and click download. **Don't click anything else.** Wait for all the tabs loaded, they should close by itself once pages are downloaded.
3. Each chapter will be saved as 

```
<bookname>-ch<xxx>.mhtml
```
in your download directory.

## Disclaimer
This is used for research purpose only. Please do not use for commercial activity.
