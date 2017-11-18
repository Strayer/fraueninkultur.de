var initPhotoSwipeFromDOM = function (gallerySelector) {
    var parseThumbnailElements = function (el) {
        var thumbElements = document.querySelectorAll(gallerySelector),
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            imgEl,
            figcaptionEl,
            size,
            item;
        // FIXME: remove after debugging
        // console.log(thumbElements);

        for (var i = 0; i < numNodes; i++) {

            imgEl = thumbElements[i];
            linkEl = imgEl.parentNode;
            figureEl = linkEl.parentNode;
            figcaptionEl = figureEl.getElementsByTagName('figcaption')[0];

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10),
            };

            // get item title and text from <figcaption> if we got one
            if (figcaptionEl) {
                // <figcaption> content
                item.title = figcaptionEl.innerHTML;

                // used for Twitter, Pinterest sharing text:
                // <figcaption> title if exists, otherwise content
                if (figcaptionEl.title.length > 0) {
                    item.text = figcaptionEl.title;
                } else {
                    // use <figcaption> content but remove all HTML tags from it
                    // add a blank between adjacent tags first, then remove all tags,
                    // which clearly makes for a much more readable output :-)
                    item.text = figcaptionEl.innerHTML.replace(/></g, "> <").replace(/<\/?[^>]+(>|$)/g, "");
                }
            }

            // <img> thumbnail element, retrieving thumbnail url
            // If thumbnail aspect ratio does not match large image,
            // do not define msrc property for slide objects
            // and enable opacity transition option
            // (showHideOpacity:true, getThumbBoundsFn:false).
            //item.msrc = imgEl.getAttribute('src');

            item.el = imgEl; // save link to element for getThumbBoundsFn

            items.push(item);
        }
        // FIXME: remove after debugging
        //console.log(items);
        return items;

    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function (e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var clickedListItem = e.target || e.srcElement;

        // find index of clicked item
        // you may define index via data- attribute on the <img> tag
        // clicked gallery is the section wrapping the figure wrapping the a
        // data-pswp-uid should have already been set (manually or by code below)
        var clickedGallery = clickedListItem.parentNode.parentNode.parentNode,
            index = clickedListItem.getAttribute('data-pswp-uid') - 1;

        // FIXME: remove after debugging
        //console.log(clickedListItem);
        //console.log(clickedGallery);
        //console.log(index);

        if (index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe(index, clickedGallery);
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function () {
        var hash = window.location.hash.substring(1),
            params = {};

        if (hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if (!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if (pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if (params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function (index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            // If thumbnail aspect ratio does not match large image,
            // do not define msrc property for slide objects
            // and enable opacity transition option
            //getThumbBoundsFn: function(index) {
            //  // See Options -> getThumbBoundsFn section of documentation for more info
            //  var thumbnail = items[index].el, // find thumbnail
            //    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
            //    rect = thumbnail.getBoundingClientRect();
            //
            //  return {
            //    x: rect.left,
            //    y: rect.top + pageYScroll,
            //    w: rect.width
            //  };
            //},
            showHideOpacity: true, // better if thumbs don’t have image aspect ratio

            shareButtons: [
                {
                    id: 'facebook',
                    label: '<i class="fa fa-facebook-official"></i>&emsp;Share on Facebook',
                    url: '//www.facebook.com/sharer/sharer.php?u={{url}}'
                },
                {
                    id: 'twitter',
                    label: '<i class="fa fa-twitter"></i>&emsp;Tweet on Twitter',
                    url: '//twitter.com/intent/tweet?text={{text}}&url={{url}}'
                },
                {
                    id: 'pinterest',
                    label: '<i class="fa fa-pinterest"></i>&emsp;Pin on Pinterest',
                    url: '//www.pinterest.com/pin/create/button/?url={{url}}&media={{image_url}}&description={{text}}'
                },
                {
                    id: 'download',
                    label: '<i class="fa fa-download"></i>&emsp;Download',
                    url: '{{raw_image_url}}',
                    download: true
                }
            ],
            // Next 3 functions return data for share links
            //
            // functions are triggered after click on button that opens share modal,
            // which means that data should be about current (active) slide
            getImageURLForShare: function (shareButtonData) {
                // 'shareButtonData' - object from shareButtons array
                //
                // 'pswp' is the gallery instance object,
                // you should define it by yourself
                //
                return gallery.currItem.src || '';
            },
            getPageURLForShare: function (shareButtonData) {
                return window.location.href;
            },
            getTextForShare: function (shareButtonData) {
                return gallery.currItem.text || '';
            },

            // Parse output of share links
            parseShareButtonOut: function (shareButtonData, shareButtonOut) {
                // 'shareButtonData' - object from shareButtons array
                // 'shareButtonOut' - raw string of share link element
                return shareButtonOut;
            },
            // make image caption self-adjust to image width
            addCaptionHTMLFn: function (item, captionEl /*, isFake */) {
                if (!item.title) {
                    captionEl.children[0].innerHTML = '';
                    return false;
                }
                captionEl.children[0].innerHTML = item.title;
                if (item.w < item.w * item.fitRatio) {
                    captionEl.children[0].style.width = item.w + 'px';
                } else {
                    captionEl.children[0].style.width = (item.w * item.fitRatio) + 'px';
                }
                return true;
            },
            bgOpacity: 0.85,
            index: 0, // start at first slide
            errorMsg: '<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>'
        };

        // PhotoSwipe opened from URL
        if (fromURL) {
            if (options.galleryPIDs) {
                // parse real index when custom PIDs are used
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for (var j = 0; j < items.length; j++) {
                    if (items[j].pid === index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if (isNaN(options.index)) {
            return;
        }

        if (disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        // FIXME: Find out how to do this better
        // on resizing the viewport, update UI to handle changing caption width
        gallery.listen('resize', function () {
            gallery.ui.update();
        });
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll(gallerySelector);

    for (var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if (hashData.pid && hashData.gid) {
        openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
    }
};

// find all objects in gallery <section> that are a <figure>
// and have an <img itemprop="thumbnail">
initPhotoSwipeFromDOM('.gallery figure [itemprop=thumbnail]');
