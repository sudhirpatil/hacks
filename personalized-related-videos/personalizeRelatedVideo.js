/**
 * Personalizes related or recommended videos ( or any list) on videos page, by bringing up un watched videos to the top
 * Tracks videos watched using browser local storage, variables mentioned as config can be used to customize this hack
 * Assumptions: url format http://xxx.yahoo.com/makingof-man-iron-fists-clip-022954868.html 
 * 				player should be yahoo video player ( mainly to find when video starts playing)
 */
YUI().use('node', 'transition', 'gallery-storage-lite', 'json-parse', 'json-stringify', function(Y) {            
    var delay = 100; // configure delay so that personalization doesn't affect loading main compontents of page
    setTimeout(Y.bind(personalizeRelatedVideo, this), delay);
    
    function personalizeRelatedVideo() {
        var listSelector = '.yom-relatedvideos ul', //config : CSS selector for list that needs to be personalized
            itemSelector = 'li', //config : Item selector in list, i.e item that need be moved around for personalization
            cleanStore = false; 
        this.partNos = 1;
        this.maxStorageItems = 50; //Config : maximum nos items that need to be shared in localstorage, to limit storage usage by this module

        Y.log(' ********* freshVideo-started  ********* ');
        this.getVideoId = function(url) {
            var regEx = /([A-Za-z0-9]+-\d+)\.html/;
            var videoId = url.match(regEx)[1];
            return videoId;
        };
        
        this.deleteStorageItems = function(videosWatched) {
            for (var key in videosWatched){
                if(!videosWatched.hasOwnProperty(key)){
                    continue;
                }
                delete videosWatched[key];
                Y.log(' ********* deleted Item - ' + key + ' *********');
                break;
            }
            
            return videosWatched;
        };

        Y.Global.on('VMMS:message',
                Y.bind(
                        function(status) {
                            if (status == 'playStart' || status == 'adStart') {
                                var videoId = this.getVideoId(window.location.pathname);
                                //to make sure u dont overrite latest update fetch from storage again
                                var videosWatched = Y.StorageLite.getItem('videosWatched', true);
                                if (!videosWatched) {
                                    videosWatched = {};
                                }
                                
                                if (!videosWatched[videoId]) {
                                    //delete half of contents if storage exceeded max count
                                    var itemCount = Object.keys(videosWatched).length;
                                    if (itemCount > this.maxStorageItems) {
                                        videosWatched = this.deleteStorageItems(videosWatched);
                                    }

                                    Y.log(' *** Items in stored object - ' + itemCount + '*** adding - ' + videoId + '*********');
                                    //add current video to storage
                                    videosWatched[videoId] = '1';
                                    Y.StorageLite.setItem('videosWatched', videosWatched, true);
                                } else {
                                    Y.log('****** VideoId - ' + videoId + ' already present in storage *****');
                                }   
                            }   
                        }, this)
        );  

        
        var videosWatched = Y.StorageLite.getItem('videosWatched', true);
        Y.log(' ********* got from storage - ' + videosWatched.length + '*********');
        // Move already watched items to end of the list
        if (videosWatched && Object.keys(videosWatched).length > 0) {
            var listNode = Y.one(listSelector);
            this.listClone = listNode.cloneNode(true);
            this.replace = false;
            var rvItems =  this.listClone.all(itemSelector);
            rvItems.each(Y.bind(function (rvItem) {
                var url = rvItem.one('a').getAttribute('href');
                var videoId = this.getVideoId(url);
    
                if (videosWatched[videoId]) {
                    Y.log('******* Moving to bottom of list: video-' + videoId + ' ********');
                    rvItem.remove();
                    this.listClone.append(rvItem);
                    this.replace = true;
                }   
            }, this));
            if (this.replace) {
                listNode.replace(this.listClone);
            }
        }
        
        if (cleanStore) {
            Y.StorageLite.setItem('videosWatched', {}, true);
        }
    }
});


