(function (){
function getContent(cb){
  function getAsin(cb){
    var title = $("#KindleReaderIFrame")[0].contentWindow.document.getElementById("kindleReader_title").innerHTML;
    KindleDBClient.getAppDb().getTable('bookdata').getRecord({title:title}).done(function(e){cb(e[0].asin)});
  };
  function getF(asin, cb){
    var bookdb =$("#KindleReaderIFrame")[0].contentWindow.KindleReaderBookInfoProviderDB.BookInfoDB(asin);
    bookdb.getFragmentIds().done(function(e){
      bookdb.getFragments(e).done(cb);
    })
  };
  function getMD(asin, cb){KindleDBClient.getBookDb().getTable("bookinfo").getRecord({asin:asin}).done(function(e){cb(e[0].metadata)})};

  getAsin(function(asin){
  getF(asin, function(fragments){
  getMD(asin, function(md){
    var kc = $("#KindleReaderIFrame")[0].contentWindow.KindleCompression;
    c = {};
    kc.lzAddStringsToDictionary(md.cpr, c);
    kc.lzAddNumbersToDictionary(c);
    d = kc.lzGetDecompressionDictionary(c);
    content = "";
    for (var i=0; i<fragments.length; ++i)
      if (fragments[i]) content += kc.lzExpandWithStaticDictionary(fragments[i].fragmentData, d, 256);
    cb(content);
  })})})
};
getContent(function(c){document.body.innerHTML = c});
})();
