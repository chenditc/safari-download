

class DownloadBook {


  // downloads the book
  run() {
    this.getBookInfo()
      .then((info) => { this.bookInfo = info })
      .then(() => { return this.downloadChapters() })
      .then((chapters) => { return this.zipChapters(chapters) })
      .then((zip) => { return this.downloadFile(zip) })
  }

  // gets the book id from the url - when you have a chapter open, this is
  // available in the `window.g` object, but not if you're on the book
  // description page
  getBookId(url) {
    // match a url like:
    // https://www.safaribooksonline.com/library/view/startup-opportunities-2nd/9781119378181/
    // https://www.safaribooksonline.com/library/view/startup-growth-engines/77961SEM00001/
    let match = url.match(/\/library\/view\/[^\/]+\/(\w+)\//)
    let bookId = match && match[1]

    if (!bookId) {
      throw new Error('could not extract book id from url')
    }

    return bookId
  }

  getBookInfo() {
    let url = `https://www.safaribooksonline.com/api/v1/book/${this.bookId}/`
    return this.get(url)
  }

  downloadChapters() {
    return Promise.map(this.bookInfo.chapters, (url) => {
      return this. downloadChapter(url)
    }, {concurrency: 10})
  }

  downloadChapter(url) {
    return this.get(url).then((chapterInfo) => {
      return this.capturePage(chapterInfo.web_url).then((mhtml) => {
        let name = chapterInfo.filename.replace(/(html|xhtml)$/, 'mhtml')
        return {
          name: name,
          mhtml: mhtml
        }
      })
    })
  }

  capturePage(url) {
    let tabId = null
    return new Promise((resolve) => {
      chrome.tabs.create({url: url, active: false}, resolve)
    }).then((tab) => {
      tabId = tab.id
      return new Promise((resolve) => {
        function listener(_tabId, changeInfo)  {
          if (tabId == _tabId && changeInfo.status == 'complete') {
            chrome.tabs.onUpdated.removeListener(listener)
            resolve()
          }
        }
        chrome.tabs.onUpdated.addListener(listener)
      })
    }).then((tab) => {
      return new Promise((resolve) => {
        chrome.pageCapture.saveAsMHTML({tabId: tabId}, resolve)
      })
    }).then((mhtml) => {
      chrome.tabs.remove(tabId)
      return mhtml
    })
  }

  zipChapters(chapters) {
    let zip = new JSZip()
    chapters.forEach((chapter) => {
      zip.file(chapter.name, chapter.mhtml)
    })
    return zip.generateAsync({type: 'blob'})
  }

  downloadFile(file) {
    let filename = this.bookInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    let url = window.URL.createObjectURL(file) 
    let link = document.createElement('a')
    link.download = `${filename}.zip`
    link.href = url
    link.click()
    window.URL.revokeObjectURL(url)
  }

}
