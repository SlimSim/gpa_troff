/*
  This file is part of Troff.

  Troff is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License,
  or (at your option) any later version.

  Troff is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Troff. If not, see <http://www.gnu.org/licenses/>.
*/

// "use strict";

var gGalleryIndex = 0;     // gallery currently being iterated
var gGalleryReader = null; // the filesytem reader for the current gallery
var gDirectories = [];     // used to process subdirectories
var gGalleryArray = [];    // holds information about all top-level Galleries found - list of DomFileSystem
var gGalleryData = [];     // hold computed information about each Gallery
var gCurOptGrp = null;
var imgFormats = [];//no images suporoted as of yet //['png', 'bmp', 'jpeg', 'jpg', 'gif', 'png', 'svg', 'xbm', 'webp'];
var audFormats = ['wav', 'mp3'];
var vidFormats = ['3gp', '3gpp', 'avi', 'flv', 'mov', 'mpeg', 'mpeg4', 'mp4', 'ogg', 'webm', 'wmv'];

function errorPrintFactory(custom) {
   return function(e) {
      var msg = '';

      switch (e.code) {
         case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
         case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
         case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
         case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
         case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
         default:
            msg = 'Unknown Error';
            break;
      }

      console.error(custom + ': ' + msg);
   };
}



function GalleryData(id) {
  this._id = id;
  this.path = "";
  this.sizeBytes = 0;
  this.numFiles = 0;
  this.numDirs = 0;
}


function addImageToContentDiv() {
  var content_div = document.getElementById('content');
  var image = document.createElement('img');
  image.style["max-width"] = "100%";
  image.style["max-height"] = "200px";

  content_div.appendChild(image);
  return image;
}

function addAudioToContentDiv() {
  var content_div = document.getElementById('content');
  var audio = document.createElement('audio');
  audio.addEventListener('loadedmetadata', function(e){
    Troff.setMetadata(audio);
  });
  content_div.appendChild(audio);
  return audio;
}

function addVideoToContentDiv() {
  var content_div = document.getElementById('content');
  var videoBox = document.createElement('div');
  var video = document.createElement('video');

  var fsButton = document.createElement('button');
  var fsButton2 = document.createElement('button');
  var fsButton3 = document.createElement('button');

  var margin = "4px";
  video.style.marginTop = margin;
  video.style.marginBottom = margin;
  fsButton.style.marginTop = margin;
/*
  fsButton2.style.marginTop = margin;
  fsButton2.style.marginRight = margin;
  fsButton2.style.marginLeft = margin;
  fsButton3.style.marginTop = margin;
*/
  fsButton.addEventListener('click', Troff.playInFullscreenChanged);
  fsButton.appendChild( document.createTextNode('Play in Fullscreen') );
  fsButton.setAttribute('id', "playInFullscreenButt");
  fsButton.setAttribute('class', "onOffButton");
  /*
  fsButton2.addEventListener('click', Troff.playInFullscreenChanged);
  fsButton2.appendChild( document.createTextNode("Use 'F' to toggle Fullscreen") );
  fsButton2.setAttribute('id', "useFtoToggleFullscreenButt");
  
  fsButton3.addEventListener('click', Troff.playInFullscreenChanged);
  fsButton3.appendChild( document.createTextNode("No Fullscreen") );
  fsButton3.setAttribute('id', "useFtoToggleFullscreenButt");
  */
//  kanske ha bara en knapp, som man inte kan tobbla med 'f', och det f gör är 
//  att den helt enkelt togglar fullscreen?
  
  videoBox.setAttribute('id', "videoBox");

  video.addEventListener('loadedmetadata', function(e){
    Troff.setMetadata(video);
  });

  content_div.appendChild(fsButton);
//  content_div.appendChild(fsButton2);
//  content_div.appendChild(fsButton3);
  
  videoBox.appendChild(video);
  content_div.appendChild(videoBox);
  return video;
}

function getFileType(filename) {
   var ext = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();
   if (imgFormats.indexOf(ext) >= 0)
      return "image";
   else if (audFormats.indexOf(ext) >= 0)
      return "audio";
   else if (vidFormats.indexOf(ext) >= 0)
      return "video";
   else return null;
}

function clearContentDiv() {
   var content_div = document.getElementById('content');
   while (content_div.childNodes.length >= 1) {
      content_div.removeChild(content_div.firstChild);
   }
}

function clearList() {
  document.getElementById("newSongListPartAllSongs").innerHTML = "";
}

function checkIfSongExists(fullPath, galleryId){
  var fsId = galleryId;
  var fs = null;
  // get the filesystem that the selected file belongs to
  for (var i=0; i < gGalleryArray.length; i++) {
    var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(gGalleryArray[i]);
    if (mData.galleryId == fsId) {
      fs = gGalleryArray[i];
      break;
    }
  }
  if(fs) return true;
  return false;
}

function setSong(fullPath, galleryId){
  Troff.pauseSong();

  var fsId = galleryId;
  var fs = null;
  // get the filesystem that the selected file belongs to
  for (var i=0; i < gGalleryArray.length; i++) {
    var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(gGalleryArray[i]);
    if (mData.galleryId == fsId) {
      fs = gGalleryArray[i];
      break;
    }
  }
  if (fs) {
    var path = fullPath;
    DB.setCurrentSong(path, galleryId);

    Troff.setWaitForLoad(path, galleryId);
    fs.root.getFile(path, {create: false}, function(fileEntry) {
       var newElem = null;
       // show the file data
       clearContentDiv();
       var type = getFileType(path);
       if (type == "image")
          newElem = addImageToContentDiv();
       else if (type == "audio")
          newElem = addAudioToContentDiv();
       else if (type == "video")
          newElem = addVideoToContentDiv();
       if (newElem) {
          // Supported in Chrome M37 and later.
          if (!chrome.mediaGalleries.getMetadata) {
            //console.info("I'm in the if, so no metadata...");
            newElem.setAttribute('src', fileEntry.toURL());
          } else {
            
            fileEntry.file(function(file) {
              chrome.mediaGalleries.getMetadata(file, {}, function(metadata) {
                if(metadata.title){
                  $('#currentSong').text( metadata.title ).show();
                  if(metadata.artist)
                    $('#currentArtist').text( metadata.artist );
                  if(metadata.album)
                    $('#currentAlbum').text ( metadata.album ).show();
                } else {
                  $('#currentArtist').text(Troff.pathToName(path));
                }
/*                if (metadata.attachedImages.length) {
                  var blob = metadata.attachedImages[0];
                  var posterBlobURL = URL.createObjectURL(blob);
                  newElem.setAttribute('poster', posterBlobURL);
                } //end if
*/
                newElem.setAttribute('src', fileEntry.toURL());
              }); // end chrome.mediaGalleries.getMetadata-function
            });//end fileEntry.file-function
          }
       }//end if(newElem)
    });
   }//end if(fs)
}//end setSong

function addGallery(name, id) {
  var li = document.createElement("li");
  var label = document.createElement("label");
  var checkbox = document.createElement("input");
  var optGrp = document.createElement("h3");
  optGrp.appendChild(document.createTextNode(Troff.getLastSlashName(name)));
  optGrp.setAttribute("id", id);
  optGrp.setAttribute("class", "bold");
  checkbox.setAttribute("type", "checkbox");
  label.setAttribute("class", "flexrow");
  label.appendChild(checkbox);
  label.appendChild(optGrp);
  li.appendChild(label);
  li.setAttribute("galleryid", id);
  li.setAttribute("fullPath", name);
  li.setAttribute("isDirectory", true);
  document.getElementById("newSongListPartAllSongs").appendChild(li);
  return optGrp;
}

function addItem(itemEntry) {
  if (itemEntry.isFile) {
    itemEntry.getMetadata(function(metadata){
      if(metadata.title || metadata.titel || metadata.artist){
        console.info("Haleluja! The metadata is accessable from here!!!!");
        console.info('artist = ' + metadata.artist);
        console.info('title = ' + metadata.title);
      }
    });
    var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(itemEntry.filesystem);
    var li = document.createElement("li");
    var label = document.createElement("label");
    var checkbox = document.createElement("input");
    var div = document.createElement("div");
    div.setAttribute("class", "flex");
    div.appendChild(document.createTextNode(Troff.pathToName(itemEntry.fullPath)));
    checkbox.setAttribute("type", "checkbox");
    label.setAttribute("class", "flexrow");
    label.appendChild(checkbox);
    label.appendChild(div);
    li.setAttribute("fullPath", itemEntry.fullPath );
    li.setAttribute("galleryId", mData.galleryId );
    li.setAttribute("isDirectory", false);
    li.appendChild(label);
    document.getElementById("newSongListPartAllSongs").appendChild(li);
    // Slim sim remove 
    /*
      This (the following if) is only to ease the transition between 
      v0.3 to v0.4,
      it is not used a single time after they open the app with v0.4 
    */
    if(Troff.iCurrentGalleryId == -1 && itemEntry.fullPath == Troff.strCurrentSong )
      setSong(itemEntry.fullPath, mData.galleryId);
    
  } else {
    //slim sim, is this else ever used?
    console.info("\n\n\n********* else! This else is used! itemEntry:", itemEntry,"\n\n");
    //IO.alert("The else is used! Search for: code_7954");
    var liHead = document.createElement("li");
    var group = document.createElement("h3");
    gruop.appendChild(document.createTextNode(itemEntry.name));
    liHead.appendChild(group);
    document.getElementById("newSongListPartAllSongs").appendChild(liHead);
   }
   
}

function scanGallery(entries) {
  
  // when the size of the entries array is 0,
  // we've processed all the directory contents
  if (entries.length === 0) {
    if (gDirectories.length > 0) {
      var dir_entry = gDirectories.shift();
      gGalleryReader = dir_entry.createReader();
      gGalleryReader.readEntries(scanGallery, errorPrintFactory('readEntries'));
    }
    else {
      gGalleryIndex++;
      if (gGalleryIndex < gGalleryArray.length) {
        scanGalleries(gGalleryArray[gGalleryIndex]);
      }
    }


    if(Troff.stopTimeout) clearInterval(Troff.stopTimeout);
    Troff.stopTimeout = setTimeout(function(){
      DB.getCurrentSonglist(); // this reloads the current songlist
      clearInterval(Troff.stopTimeout);
    }, 42);
    return;
  }
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].isFile) {
      addItem(entries[i]);
      gGalleryData[gGalleryIndex].numFiles++;
      loopFunktion(entries, gGalleryData[gGalleryIndex], i);
    }
    else if (entries[i].isDirectory) {
      gDirectories.push(entries[i]);
    }
    else {
      console.info("Got something other than a file or directory.");
    }
  }
  // readEntries has to be called until it returns an empty array. According to the spec,
  // the function might not return all of the directory's contents during a given call.
  gGalleryReader.readEntries(scanGallery, errorPrintFactory('readMoreEntries'));
}

function loopFunktion(entries, galData, i) {
  entries[i].getMetadata(function(metadata){
    galData.sizeBytes += metadata.size;
  });
}

function scanGalleries(fs) {
   var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);

   gCurOptGrp = addGallery(mData.name, mData.galleryId);
   gGalleryData[gGalleryIndex] = new GalleryData(mData.galleryId);
   gGalleryReader = fs.root.createReader();
   gGalleryReader.readEntries(scanGallery, errorPrintFactory('readEntries'));
}

function getGalleriesInfo(results) {
  clearContentDiv();
  clearList();
  if (results.length) {
    gGalleryArray = results; // store the list of gallery directories
    gGalleryIndex = 0;
    scanGalleries(gGalleryArray[0]);
  }
  else {
    /* NO GALLERIES FOUND:
     * Here i should display a message to the user, urging him or here
     * to add a directory, or a directory with a song in it...
     */
    IO.alert(
      'No songs or videos found, '+
      'please add a directory with a song or video in it.'+
      '(do this under "Songs", and then "Select folders")'
    );
  }

}

function FSstartFunc(){
  chrome.mediaGalleries.getMediaFileSystems({
     interactive : 'if_needed'
  }, getGalleriesInfo);

  document.getElementById('configure-button').addEventListener("click", function() {
    chrome.mediaGalleries.getMediaFileSystems({
      interactive : 'yes'
    }, getGalleriesInfo);
  });
} // end window load



//******************************************************************************
//* End FS - File System ----------------------------------------------------- *
//******************************************************************************





var TroffClass = function(){
    var strCurrentSong = "";
    var iCurrentGalleryId = 0;
    var startTime = 0; // unused?
    var previousTime = 0; // unused?
    var time = 0; // unused?
    var nrTapps = 0;
    var m_zoomStartTime = 0;
    var m_zoomEndTime = null;


  //Public variables:
  this.dontShowZoomInstructions = false;

  this.firstTimeUser = function(){
    $('#firstTimeUserDialog').show();
  };
  
  this.firstTimeUserDialogTour = function(){
    $('#firstTimeUserDialog').hide();
    IO.openHelpWindow();
  };

  this.firstTimeUserDialogOK = function(){
    $('#firstTimeUserDialog').hide();
  };

  // this is regarding the "play in fullscreen" - button
  this.setPlayInFullscreen = function(bPlayInFullscreen){
    var butt = document.querySelector('#playInFullscreenButt');
    butt.classList.toggle("active", bPlayInFullscreen);
  };

  // this is regarding the "play in fullscreen" - button
  this.playInFullscreenChanged = function(){
    var butt = document.querySelector('#playInFullscreenButt');
    butt.classList.toggle("active");

    var bFullScreen = butt.classList.contains('active');
    DB.setCurrent(strCurrentSong, 'bPlayInFullscreen', bFullScreen );

    document.getElementById('blur-hack').focus();
  };
  
  // this is regarding the f-key, IE- the actual fullscreen
  this.forceFullscreenChange = function(){
    var videoBox = document.querySelector('#videoBox');
    if(!videoBox) return;
//    var infoSection = document.querySelector('#infoSection');
    if(videoBox.classList.contains('fullscreen')){
      videoBox.classList.remove('fullscreen');
    } else {
      videoBox.classList.add('fullscreen');
    }
  };
  
  // this is regarding the f/esc-key, IE- the actual fullscreen
  this.forceNoFullscreen = function(){
    var videoBox = document.querySelector('#videoBox');
    if(!videoBox) return;
    videoBox.classList.remove('fullscreen');
  };

  /* this funciton is called when the full song/video is loaded,
   * it should thus do the things that conect player to Troff...
   */
  this.setMetadata = function(media){
    var songLength = media.duration;
    document.getElementById('timeBar').max = media.duration;
    $('#maxTime')[0].innerHTML = Troff.secToDisp(media.duration);

    DB.getSongMetaDataOf(Troff.getCurrentSong());
    media.addEventListener("timeupdate", Troff.timeupdateAudio );
  };

  this.getStandardMarkerInfo = function(){
    return "This text is specific for every selected marker. "
      +"Notes written here will be automatically saved."
      +"\n\nUse this area for things regarding this marker.";
  };

  this.setWaitBetweenLoops = function(bActive, iWait){
    $('#waitBetweenLoops').val(iWait);
    if(bActive){
      $('#buttWaitBetweenLoops').addClass('active');
      $('#waitBetweenLoops').removeClass('grayOut');
    } else {
      $('#buttWaitBetweenLoops').removeClass('active');
      $('#waitBetweenLoops').addClass('grayOut');
    }
  };
  this.setCurrentWaitBetweenLoops = function(){
    console.info("needs fixing, - why?");
    var wait = $('#waitBetweenLoops').val();
    var bActive = $('buttWaitBetweenLoops').hasClass('active');
    DB.setCurrent(strCurrentSong, 'wait', [bActive, wait]);
  };
  this.toggleWaitBetweenLoops = function(){
    $('#buttWaitBetweenLoops').toggleClass('active');
    $('#waitBetweenLoops').toggleClass('grayOut');
    Troff.setCurrentWaitBetweenLoops();
  };
  this.getWaitBetweenLoops = function(){
    if($('#waitBetweenLoops').hasClass('grayOut'))
      return 0;
    return $('#waitBetweenLoops').val();
  };

  this.toggleStopAfter = function(){
    $('#buttStopAfter').toggleClass('active');
    $('#stopAfter').toggleClass('grayOut');
    Troff.setCurrentStopAfter();
    Troff.settAppropriateActivePlayRegion();
    document.getElementById('blur-hack').focus();
  };

  this.setCurrentStopAfter = function() {
    DB.setCurrentStopAfter(
        strCurrentSong,
        $('#buttStopAfter').hasClass('active'),
        $('#stopAfter').val()
    );
  };

  this.getNewMarkerId = function(){
    return Troff.getNewMarkerIds(1)[0];
  };

  this.getNewMarkerIds = function(iNrOfIds){
    var a = [];
    var aRet = [];
    var nr = 0;
    for(var i=0; i<iNrOfIds; i++){
      while($('#markerNr'+nr).length > 0 || a.indexOf(nr) != -1){
        nr++;
      }
      a[i] = nr;
      aRet[i] = "markerNr" + nr;
    }
    return aRet;
  };

  this.setCurrentStartBefore = function() {
    DB.setCurrentStartBefore(
        strCurrentSong,
        $('#buttStartBefore').hasClass('active'),
        $('#startBefore').val()
    );
  };

  this.updateStartBefore = function() {
    if( $('audio, video')[0].paused )
      $('audio, video')[0].currentTime = Troff.getStartTime();
    Troff.settAppropriateActivePlayRegion();
  };

  this.setCurrentPauseBefStart = function(){
    DB.setCurrentPauseBefStart(
        strCurrentSong,
        $('#buttPauseBefStart').hasClass('active'),
        $('#pauseBeforeStart').val()
    );
  };

  this.togglePauseBefStart = function(){
    $('#buttPauseBefStart').toggleClass('active');
    $('#pauseBeforeStart').toggleClass('grayOut');
    Troff.updateSecondsLeft();
    document.getElementById('blur-hack').focus();
    Troff.setCurrentPauseBefStart();
  };

  this.speedUpdate = function() {
    var sliderVal = document.getElementById("speedBar").value;
    $('#speed').html(sliderVal);
    $('audio, video')[0].playbackRate = sliderVal/100;
    DB.setCurrentSpeed(strCurrentSong, sliderVal);
  };
  this.speed = function(inpObj) {
    var speed = inpObj.data;
    if(speed == 1 || speed == -1)
        speed = $('audio, video')[0].playbackRate * 100 + (5*speed);
    $('#speedBar').val( speed );
    document.getElementById('blur-hack').focus();
    Troff.speedUpdate();
  };

  this.volumeUpdate = function() {
    var sliderVal = document.getElementById("volumeBar").value;
    $('#volume').html(sliderVal);
    $('audio, video')[0].volume = sliderVal/100;
    DB.setCurrentVolume(strCurrentSong, sliderVal);
  };
  this.volume = function(inpObj) {
    var volume = inpObj.data;
    if(volume == 1 || volume == -1)
        volume = $('audio, video')[0].volume * 100 + (5*volume);
    $('#volumeBar').val( volume );
    document.getElementById('blur-hack').focus();
    Troff.volumeUpdate();
  };

  /* This is used when the value of the slider is changed,
   * to update the audio / video
   */
  this.timeUpdate = function() {
    var sliderVal = document.getElementById("timeBar").value;
    $('#time').html(Troff.secToDisp(sliderVal));

    if( sliderVal > Troff.getStopTime() ){
      var aFirstAndLast = Troff.getFirstAndLastMarkers();
      var firstMarkerId = aFirstAndLast[0];
      var lastMarkerId = aFirstAndLast[1] + 'S';

      if(sliderVal < $('#' + lastMarkerId)[0].timeValue )
        Troff.selectStopMarker(lastMarkerId);
      else {
        IO.confirm('Out of range', 'You pressed outside the playing region, '
          + 'do you want to add a marker to the end of the song?', function(){
          var songLength = Number(document.getElementById('timeBar').max);
          
          var oMarker = {};
          oMarker.name = "End";
          oMarker.time = songLength;
          oMarker.info = "";
          oMarker.id = Troff.getNewMarkerId();
      
          aMarkers = [oMarker];
          Troff.addMarkers(aMarkers); // adds marker to html
          DB.saveMarkers(Troff.getCurrentSong() ); // saves end marker to DB

          var aFirstAndLast = Troff.getFirstAndLastMarkers();
          var firstMarkerId = aFirstAndLast[0];
          var lastMarkerId = aFirstAndLast[1] + 'S';
          Troff.selectStopMarker(lastMarkerId);
          document.querySelector('audio, video').currentTime = sliderVal;
        });
      }
    }// end if

    document.querySelector('audio, video').currentTime = sliderVal;
  }; // end timeUpdate

  this.getStopTime = function() {
    var extraTime = 0;
        if( $('#buttStopAfter').hasClass('active') )
        extraTime = $('#stopAfter').val() ? $('#stopAfter').val() : 0;
    if($('.currentStopMarker')[0])
        return Math.min(parseFloat($('.currentStopMarker')[0].timeValue)+
                parseFloat(extraTime), $('audio, video')[0].duration);
    else
        return $('audio, video')[0].duration;
  };

  this.getStartTime = function() {
    if($('.currentMarker')[0]){ //if there is a start marker
        var extraTime = 0;
        if( $('#buttStartBefore').hasClass('active') )
        extraTime = $('#startBefore').val() ? $('#startBefore').val() : 0;
        return Math.max(parseFloat($('.currentMarker')[0].timeValue)-
                parseFloat(extraTime), 0);
    }
    return 0;
  };

  this.setLoopTo = function(number){
    if(number===0) number = "Inf";

    $('.currentLoop').removeClass('currentLoop');
    if(number){
        $('#buttLoop'+number).addClass('currentLoop');
    } else {
        $(this).addClass('currentLoop');
    }
    Troff.updateLoopTimes();
  };

  this.setLoop = function(mode){
    $('.currentLoop').removeClass('currentLoop');
    $(this).addClass('currentLoop');

    Troff.updateLoopTimes();
    document.getElementById('blur-hack').focus();
  };

  this.updateLoopTimes = function(){
    var dbLoop = '';
    if($('#buttLoopInf').hasClass('currentLoop') )
        dbLoop = 'Inf';
    else
        dbLoop = $('.currentLoop').val();

    if(strCurrentSong)
      DB.setCurrent(strCurrentSong, 'loopTimes', dbLoop );

    IO.loopTimesLeft( $(".currentLoop").val() );
  }; // end updateLoopTimes


  this.getMood = function(){
    if( $('#infoSection').hasClass('pause') )
        return 'pause';
    if( $('#infoSection').hasClass('wait') )
        return 'wait';
    if( $('#infoSection').hasClass('play') )
        return 'play';
    console.error('infoSection hase not correct class!');
  };

  /* this is used every time the time changes in the audio / video */
  this.timeupdateAudio = function() {
    var audio = document.querySelector('audio, video');
    var dTime = audio.currentTime;

    if(dTime >= Troff.getStopTime()){
        Troff.atEndOfLoop();
    }

    $('#time').html(Troff.secToDisp(dTime));
    document.getElementById("timeBar").value = dTime;
  }; // end timeupdateAudio

  this.atEndOfLoop = function(){
      var audio = document.querySelector('audio, video');
    Troff.goToStartMarker();
    var dTime = audio.currentTime;
    audio.pause();

    if( Troff.isLoopOn() ){
      if(Troff.isLoopInfinite() ) {
        Troff.playSong( Troff.getWaitBetweenLoops()*1000 );
      } else {
        if ( IO.loopTimesLeft()>1 ){
          IO.loopTimesLeft( -1 );
          Troff.playSong( Troff.getWaitBetweenLoops()*1000 );
        } else {
          IO.loopTimesLeft( $('#loopTimes').val() );
          Troff.pauseSong();
        }
      } // end else
    } else {
      Troff.pauseSong(); //This is needed because it setts the mood to 'pause'
    }
  }; // end atEndOfLoop


  this.isLoopOn = function(){
    return !$('#buttLoopOff').hasClass('currentLoop');
  };

  this.isLoopInfinite = function(){
    return $('#buttLoopInf').hasClass('currentLoop');
  };

  // goToStartMarker anvÃ¤nds nÃ¤r man updaterar startBefore / trycker pÃ¥ StartBefore  / trycker pÃ¥ en marker???
  this.goToStartMarker = function(){
    document.querySelector('audio, video').currentTime = Troff.getStartTime();
  }; // end goToStartMarker

  this.enterKnappen = function(){
    if( Troff.getMood() == 'pause'){
        Troff.playSong();
    } else {
        Troff.pauseSong();
    }
    document.getElementById('blur-hack').focus();
  };// end enterKnappen

  this.space = function(){
    var audio = document.querySelector("audio, video");
    if(!audio){
        console.error("no song loaded");
        return;
    }

    Troff.goToStartMarker();
    if( Troff.getMood() == 'pause'){
        if($('#buttPauseBefStart').hasClass('active')){
        Troff.playSong( $('#pauseBeforeStart').val()*1000 );
        }
        else
        Troff.playSong();
    } else {
        Troff.pauseSong();
    }
    document.getElementById('blur-hack').focus();
  }; // end space()

  this.playSong = function(wait){
    wait = wait || 0;
    var audio = document.querySelector('audio, video');
    if (!audio) return;

    var secondsLeft = wait/1000;
    $('.secondsLeft').html(secondsLeft);

    if(Troff.stopTimeout) clearInterval(Troff.stopTimeout);
    Troff.setMood('wait');
    Troff.stopTimeout = setTimeout(function(){
        if(Troff.getMood() == 'pause' ) return;
        audio.play();
        Troff.setMood('play');
    }, wait);

    // stopInterval is the counter
    if(Troff.stopInterval) clearInterval(Troff.stopInterval);
    Troff.stopInterval = setInterval(function() {
        if(Troff.getMood() == 'wait' ){ //audio.isPaused) {
        secondsLeft -= 1;
        if(secondsLeft <= 0 ){
            $('.secondsLeft').html(0);
            clearInterval(Troff.stopInterval);
        } else {
            $('.secondsLeft').html(secondsLeft);
        }
        }  else {
        clearInterval(Troff.stopInterval);
        $('.secondsLeft').html( 0 );
        }
    }, 1000);
  }; // end playSong

  this.pauseSong = function(){
    var audio = document.querySelector('audio, video');
    if (audio)
        audio.pause();
    Troff.setMood('pause');
    Troff.updateLoopTimes();

    if(Troff.stopTimeout)  clearInterval(Troff.stopTimeout);
    if(Troff.stopInterval) clearInterval(Troff.stopInterval);

  };

  this.updateSecondsLeft = function(){
    if(Troff.getMood() == 'pause'){
        if ($('#buttPauseBefStart').hasClass('active'))
        $('.secondsLeft').html( $('#pauseBeforeStart').val() );
        else
        $('.secondsLeft').html( 0 );
    }
  };

  this.setMood = function( mood ){
    if(mood == 'pause'){
      $('#infoSection, .moodColorizedText').removeClass('play wait').addClass('pause');
      Troff.updateSecondsLeft();
      if(document.querySelector('#playInFullscreenButt.active')){
        document.querySelector('#videoBox').classList.remove('fullscreen');
        document.querySelector('#infoSection').classList.remove('overFilm');
      }
      $('#buttSpacePlay').css('display', 'block');
      $('#buttSpacePause').css('display', 'none');
    }
    if(mood == 'wait'){
      $('#infoSection, .moodColorizedText').removeClass('play pause').addClass('wait');
      if(document.querySelector('#playInFullscreenButt.active')){
        document.querySelector('#videoBox').classList.add('fullscreen');
        document.querySelector('#infoSection').classList.add('overFilm');
      }
      $('#buttSpacePlay').css('display', 'none');
      $('#buttSpacePause').css('display', 'block');
    }
    if(mood == 'play'){
      $('#infoSection, .moodColorizedText').removeClass('wait pause').addClass('play');
      if(document.querySelector('#playInFullscreenButt.active')){
        document.querySelector('#videoBox').classList.add('fullscreen');
        document.querySelector('#infoSection').classList.remove('overFilm');
      }
      $('#buttSpacePause').css('display', 'block');
      $('#buttSpacePlay').css('display', 'none');
    }
  };

  // Troff. ...
  this.getCurrentSong = function() {
    return strCurrentSong;
  };
  this.getCurrentGalleryId = function() {
    return iCurrentGalleryId;
  };

  this.setWaitForLoad = function(path, iGalleryId){
    if(strCurrentSong){
        Troff.pauseSong();
        Troff.clearAllMarkers();
        Troff.clearAllStates();
        Troff.setTempo('?');
        Troff.setWaitBetweenLoops(true, 1);
    }
    Troff.setAreas([false, true, false, false, false, false]);
    strCurrentSong = path;
    iCurrentGalleryId = iGalleryId;

    $('#currentArtist').text("Wait for song to load");
    $('#currentSong, #currentAlbum').hide();
  };

  this.setCurrentSong = function(){
    DB.setCurrentSong(strCurrentSong, iCurrentGalleryId);
//    $('#infoSection').show();
  }; // end SetCurrentSong

  this.pathToName = function(filepath){
    // ska jag ha 1 eller filepath.lastIndexOf('/') ???
    return filepath.substr(1,filepath.lastIndexOf('.') - 1);
  };

  this.getCurrentStates = function(){
    return $('#stateList').children();
  };
  
  this.getCurrentMarkers = function(bGetStopMarkers){
    if(bGetStopMarkers){
      return $('#markerList li input:nth-child(4)');
    }
    return $('#markerList li input:nth-child(3)');
  };

  /*
    exportStuff, gets current song markers to the clippboard
  */
  this.exportStuff = function(){
    Troff.toggleImportExport();
    DB.getMarkers( strCurrentSong, function(aoMarkers){
      var oExport = {};
      oExport.aoMarkers = [];
      for (var i=0; i<aoMarkers.length; i++){
        var oTmp = {};
        oTmp.name = aoMarkers[i].name;
        oTmp.time = aoMarkers[i].time;
        oTmp.info = aoMarkers[i].info;
        oTmp.color = aoMarkers[i].color;
        oExport.aoMarkers[i] = oTmp;
      }
      var aState = $('#stateList').children();
      oExport.aoStates = [];
      for(i=0; i<aState.length; i++){
        var oState = JSON.parse(aState.eq(i).attr('strstate'));

        var currMarkerId = "#" + oState.currentMarker;
        var currStopMarkerId = "#" + oState.currentStopMarker;
        oState.currentMarkerTime = $( currMarkerId )[0].timeValue;
        oState.currentStopMarkerTime = $( currStopMarkerId )[0].timeValue;
        delete oState.currentMarker;
        delete oState.currentStopMarker;
        oExport.aoStates[i] = oState;
      }
      oExport.strSongInfo = $('#songInfoArea').val();
      var sExport = JSON.stringify(oExport);
      
      IO.prompt("Copy the marked text to export your markers", sExport);
    });
  }; // end exportStuff

  /*
    importStuff, promps for a string with markers
  */
  this.importStuff = function(){
    Troff.toggleImportExport();
    IO.prompt("Please paste the text you recieved to import the markers",
              "Paste text here",
              function(sImport){
      var oImport = JSON.parse(sImport);
      if( oImport.strSongInfo !== undefined && 
          oImport.aoStates !== undefined && 
          oImport.aoMarkers !== undefined ){
        importMarker(oImport.aoMarkers);
        importSonginfo(oImport.strSongInfo);
        importStates(oImport.aoStates);
      } else {
        //This else is here to allow for imports of 0.5 and erlier
        var aMarkersTmp = oImport;
        importMarker(aMarkersTmp);
      }
      function importMarker(aMarkers){
        var aMarkerId = Troff.getNewMarkerIds(aMarkers.length);
  
        for(var i=0; i<aMarkers.length; i++){
          // these 5 lines are here to allow for import of markers
          //from version 0.3.0 and earlier:
          var tmpName = Object.keys(aMarkers[i])[0];
          aMarkers[i].name = aMarkers[i].name || tmpName;
          aMarkers[i].time = aMarkers[i].time || Number(aMarkers[i][tmpName]) || 0;
          aMarkers[i].info = aMarkers[i].info || "";
          aMarkers[i].color = aMarkers[i].color || "None";
          //:allow for version 0.3.0 end here
          
          aMarkers[i].id = aMarkerId[i];
        }
        Troff.addMarkers(aMarkers); // adds marker to html
        DB.saveMarkers(Troff.getCurrentSong());
      }
      function importSonginfo(strSongInfo){
        $('#songInfoArea').val($('#songInfoArea').val() + strSongInfo);
        Troff.updateSongInfo();
      }
      function importStates(aoStates){
        for(var i = 0; i < aoStates.length; i++){
          var strTimeStart = aoStates[i].currentMarkerTime;
          var strTimeStop = aoStates[i].currentStopMarkerTime;
          delete aoStates[i].currentMarkerTime;
          delete aoStates[i].currentStopMarkerTime;
          aoStates[i].currentMarker = getMarkerFromTime(strTimeStart);
          aoStates[i].currentStopMarker = getMarkerFromTime(strTimeStop) + 'S';
        }
        function getMarkerFromTime(strTime){
          var aCurrMarkers = $('#markerList').children();
          for(var i=0; i<aCurrMarkers.length; i++){
            var currMarker = aCurrMarkers.eq(i).children().eq(2);
            if(currMarker[0].timeValue == strTime){
              return currMarker.attr('id');
            }
          }
          
          console.error("returnerar första markören...");
          return aCurrMarkers.eq(0).children().eq(2).attr('id');
          
        }
        
        aoStates.map(function(s){
          Troff.addButtonsOfStates([JSON.stringify(s)]);
        });
        DB.saveStates(Troff.getCurrentSong());
      }
    });
  };

  /*
    createMarker, all, tar reda pÃ¥ tiden o namnet,
    anropar sedan add- och save- Marker
   */
  this.createMarker = function(){
    var time = document.querySelector('audio, video').currentTime;
    var songSRC = $('audio, video').attr('src');
    var iMarkers =  $('#markerList li').length + 1;

    var quickTimeout = setTimeout(function(){
      
      var oFI = {};
      oFI.strHead = "Please enter the marker name here";
      var iMarkers =  $('#markerList li').length + 1;
      oFI.strInput = "marker nr " + iMarkers;
      oFI.bDouble = true;
      oFI.strTextarea = "";
      oFI.strTextareaPlaceholder = "Add extra info about the marker here.";

      IO.promptEditMarker(0, function(newMarkerName, newMarkerInfo, newMarkerColor, newTime){
        if(newMarkerName === "") return;
        
        var oMarker = {};
        oMarker.name = newMarkerName;
        oMarker.time = newTime;
        oMarker.info = newMarkerInfo || "";
        oMarker.color = newMarkerColor;
        oMarker.id = Troff.getNewMarkerId();
  
        var markers = [oMarker];
        Troff.addMarkers(markers); // adds marker to html
        DB.saveMarkers(Troff.getCurrentSong() );
      });
      clearInterval(quickTimeout);
    }, 0);
  }; // end createMarker   ********/

  this.toggleImportExport = function(){
    $('#outerImportExportPopUpSquare').toggle();
    document.getElementById('blur-hack').focus();
  };
  
  
  this.getLastSlashName = function(strUrl){
    var aUrl = strUrl.split("/");
    return aUrl[aUrl.length-1];
  };
  
  this.addSpacesBetweenSlash = function(strUrl){
    return strUrl.replace(/\//g, " / ");
  };


  this.toggleArea = function(event){
    document.getElementById('blur-hack').focus();
    var iArea = $(event.target).index();
    event.target.classList.toggle('active');

    if(iArea == 4)
      $('#userNoteSection').toggle();
    if(iArea == 5)
      $('#infoSection').toggle();
    else
      $('#areaParent').children().eq(iArea).toggle();
    DB.setCurrentAreas(Troff.getCurrentSong());
    
//    DB.setCurrentAreas();  depricated
  };
  
  this.setAreas = function(abAreas) {
    var aAreas = $('#areaSelector').children();
    for( var i = 0; i < abAreas.length; i++) {
      if(abAreas[i] != aAreas.eq(i).hasClass("active")) {
        aAreas[i].classList.toggle('active');
      }
      if(i == 4)
        $('#userNoteSection').toggle(abAreas[i]);
      else if(i == 5)
        $('#infoSection').toggle(abAreas[i]);
      else
        $('#areaParent').children().eq(i).toggle(abAreas[i]);
    }
  };
  
/*  //depricated OK
  this.selectSonglistsTab = function(){
    DB.setCurrentTab('songlists', Troff.getCurrentSong());
    $('#songlistsArea').toggle();
//    $('#gallery').hide();
//    $('#markerInfoArea').hide();
//    $('#songInfoArea').hide();
    $('#songlistsTab').toggleClass('active');
/ *
    $('#songsTab').removeClass('selected');
    $('#songinfoTab').removeClass('selected');
    $('#markerinfoTab').removeClass('selected');
* /
    document.getElementById('blur-hack').focus();
  };
*/

/*    //depricated OK
  this.selectSongsTab = function(){
    DB.setCurrentTab('songs', Troff.getCurrentSong());
//    $('#songlistsArea').hide();
    $('#songsArea').toggle();
//    $('#markerInfoArea').hide();
//    $('#songInfoArea').hide();
    $('#songsTab').toggleClass('active');
/*
    $('#songlistsTab').removeClass('selected');
    $('#songinfoTab').removeClass('selected');
    $('#markerinfoTab').removeClass('selected');
* /
    document.getElementById('blur-hack').focus();
  };
*/

/*
    //depricated OK
  this.selectStatesTab = function(){
    
    document.getElementById('blur-hack').focus();
    $('#stateSection').toggle();
    $('#statesTab').toggleClass('active');
    
  };
*/
/*
    //depricated OK
  this.selectSettingsTab = function(){
    document.getElementById('blur-hack').focus();
    $('#timeSection').toggle();
    $('#settingsTab').toggleClass('active');
  };
*/

/*    //depricated OK
  this.selectSonginfoTab = function(){
    DB.setCurrentTab('songinfo', Troff.getCurrentSong());
    $('#songlistsArea').hide();
    $('#gallery').hide();
//    $('#songInfoArea').show();
//    $('#markerInfoArea').hide();
    $('#songlistsTab').removeClass('selected');
    $('#songsTab').removeClass('selected');
    $('#songinfoTab').addClass('selected');
    $('#markerinfoTab').removeClass('selected');
    document.getElementById('blur-hack').focus();
  };
*/
/*    //depricated OK
  this.selectMarkerinfoTab = function(){
    DB.setCurrentTab('markerinfo', Troff.getCurrentSong());
    $('#songlistsArea').hide();
    $('#gallery').hide();
//    $('#songInfoArea').hide();
//    $('#markerInfoArea').show();
    $('#songlistsTab').removeClass('selected');
    $('#songinfoTab').removeClass('selected');
    $('#songsTab').removeClass('selected');
    $('#markerinfoTab').addClass('selected');
    document.getElementById('blur-hack').focus();
  };
*/  
  
  
  
  
  this.setInfo = function(info){
    $('#songInfoArea').val(info);
  };
  
/*  //depricated OK
  this.setTab = function(tab){
    console.error("troff.setTab ->");
    /** / if(tab === "songinfo") Troff.selectSonginfoTab();
    else if(tab === "markerinfo") Troff.selectMarkerinfoTab();
    else if(tab === "songs") Troff.selectSongsTab();
    else if(tab === "songlists") Troff.selectSonglistsTab();
    else /* catch all... * / Troff.selectSongsTab();

  };
*/  
  
  this.setSonglists = function(aoSonglists){
    for(var i=0; i<aoSonglists.length; i++){
      Troff.addSonglistToHTML(aoSonglists[i]);
    }
  };
  
  this.enterSongListName = function(){
    IO.setEnterFunction(function(event){
      document.getElementById('blur-hack').focus();
      Troff.saveNewSongList();
      return false;
    });
  };
  this.exitSongListName = function(){
    IO.clearEnterFunction();
    document.getElementById('blur-hack').focus();
  };
  
  this.editSonglist = function(event){
    $('#newSongListPart').show();
    $('#songListPartButtons, #songListPartTheLists').hide();
    var li = this.parentNode;
    var oSonglist = JSON.parse(li.getAttribute('stroSonglist'));
    $('#newSongListName').val(oSonglist.name);
    $('#newSongListName').attr('iSonglistId', oSonglist.id);
    
    var aSongList = [];
    var aRows = $('#newSongListPartAllSongs li');
    var aSongs = oSonglist.songs;
    var rowFP, rowGID, rowH;

    for(var i=0; i<aRows.length; i++){
      rowFP = aRows[i].getAttribute('fullPath');
      rowGID = aRows[i].getAttribute('galleryId');
      rowH = aRows.eq(i).children().children().eq(1).text();
      for(var j=0; j<aSongs.length; j++){
        if(rowH && rowH == aSongs[j].header ){
          // checking headder:
          aRows[i].children[0].children[0].checked = true;
          continue;
        }
        if(rowFP && rowFP == aSongs[j].fullPath && rowGID == aSongs[j].galleryId){
          // checking songs:
          aRows[i].children[0].children[0].checked = true;
        }
      }
      
    }
  };
  
  this.createNewSonglist = function(){
    Troff.resetNewSongListPartAllSongs();
    $('#newSongListPart').show();
    $('#songListPartButtons, #songListPartTheLists').hide();
    $('#removeSongList').hide();
    $('#newSongListName').focus();
    $('#newSongListName').click();
  };
  
  this.cancelSongList = function(){
    document.getElementById('blur-hack').focus();
    $('#newSongListPart').hide();
    $('#songListPartButtons, #songListPartTheLists').show();
    Troff.resetNewSongListPartAllSongs();
  };
  
  this.removeSonglist = function(){
    IO.confirm( 'Remove songlist?',
                'Don you want to permanently remove this songlist?',
                function(){
      $('#newSongListPart').hide();
      $('#songListPartButtons, #songListPartTheLists').show();
      document.getElementById('blur-hack').focus();
      var iSonglistId = parseInt($('#newSongListName').attr('iSonglistId'));
      
      var aSonglists = $('#songListPartTheLists li');
      for(var j=0; j<aSonglists.length; j++){
        var oCurrSonglist = JSON.parse(aSonglists.eq(j).attr('stroSonglist'));
        if(oCurrSonglist.id === iSonglistId){
          if(aSonglists.eq(j).children().hasClass('selected')){
            Troff.setSonglistById(0);
          }
          aSonglists.eq(j).remove();
          break;
        }
      }
      $('#songlistHelpText').toggle($('#songListPartTheLists >').length === 0);

      DB.saveSonglists(); // this saves the current songlists from html to DB
      Troff.resetNewSongListPartAllSongs();
    });
  };
  
  this.saveNewSongList = function(){
    $('#newSongListPart').hide();
    $('#songListPartButtons, #songListPartTheLists').show();
    
    document.getElementById('blur-hack').focus();
    var name = $('#newSongListName').val();
    if(name === "" || name === undefined) {
      IO.alert("You must give the songlist a name");
      return -1;
    }
    var iSonglistId = parseInt($('#newSongListName').attr('iSonglistId'));
    
    var aSonglist = [];
    var aRows = $('#newSongListPartAllSongs li');
    for(var i=0; i<aRows.length; i++){
      if(aRows[i].children[0].children[0] && aRows[i].children[0].children[0].checked){
        var dfullpath = aRows[i].getAttribute('fullPath');
        var dfsid = aRows[i].getAttribute('galleryId');
        var isDirectory = aRows[i].getAttribute('isDirectory') === "true";
        aSonglist.push({
          'isDirectory' : isDirectory,
          'fullPath'    : dfullpath,
          'galleryId'   : dfsid
        });
      }
    }

    if(iSonglistId === 0){
      oSongList = {};
      oSongList.id = Troff.getUniqueSonglistId();
      oSongList.name = name;
      oSongList.songs = aSonglist;
      Troff.addSonglistToHTML(oSongList);
    } else {
      var aSonglists = $('#songListPartTheLists li');
      for(var j=0; j<aSonglists.length; j++){
        var oCurrSonglist = JSON.parse(aSonglists.eq(j).attr('stroSonglist'));
        if(oCurrSonglist.id == iSonglistId){
          oCurrSonglist.name = name;
          oCurrSonglist.songs = aSonglist;
          var stroNewSonglist = JSON.stringify(oCurrSonglist);
          aSonglists.eq(j).attr('stroSonglist', stroNewSonglist);
          aSonglists.eq(j).children().eq(1).val(name);
          break;
        }
      }
    }

    Troff.resetNewSongListPartAllSongs();
    DB.saveSonglists(); // this saves the current songlists from html to DB
    DB.getCurrentSonglist(); // this reloads the current songlist
    
  };
  
  this.getUniqueSonglistId = function(){
    var iSonglistId = 1;
    var bFinniched = false;
    var aSonglists = $('#songListPartTheLists li');
    while(true){
      bFinniched = true;
      for(var i=0; i<aSonglists.length; i++){
        var oCurrSonglist = JSON.parse(aSonglists.eq(i).attr('stroSonglist'));
        if(oCurrSonglist.id == iSonglistId){
          iSonglistId++;
          bFinniched = false;
        }
      }
      if(bFinniched)
        return iSonglistId;
    }
  };
  
  this.resetNewSongListPartAllSongs = function(){
    $('#newSongListName').attr('iSonglistId', 0);
    $('#newSongListName').val('');
    $('#newSongListPartAllSongs li label input').attr('checked', false);
    $('#removeSongList').show();
  };
  
  this.addSonglistToHTML = function(oSonglist){
    var buttE = $('<input>')
      .val('E')
      .attr('type', 'button')
      .addClass('small')
      .addClass('regularButton')
      .click(Troff.editSonglist);

    var buttL = $('<input>')
      .val(oSonglist.name)
      .attr('type', 'button')
      .addClass('onOffButton')
      .click(Troff.selectSonglist);

    var li = $('<li>')
      .attr('stroSonglist', JSON.stringify(oSonglist))
      .append(buttE)
      .append(buttL);

    $('#songListPartTheLists').append(li);
    $('#songlistHelpText').hide();
  };
  
  this.setSonglistById = function(id){
    if(id === 0){
      $('#songlistAll').click();
      return;
    }
    var aSonglists = $('#songListPartTheLists li');
    for(var i=0; i<aSonglists.length; i++){
      if(JSON.parse(aSonglists.eq(i).attr('stroSonglist')).id === id){
        aSonglists.eq(i).children().eq(1).click();
        break;
      }
    }
  };
  
  this.selectSong = function(){
    var selectedSong = document.querySelector('#gallery .selected');
    if(selectedSong)
      selectedSong.classList.remove("selected");

    this.classList.add("selected");

    var fullPath = this.getAttribute('fullPath');
    var galleryId = this.getAttribute('galleryId');
    setSong(fullPath, galleryId);
  };
  
  this.showSongsHelpText = function(){
    if($('#gallery >').filter('button').length === 0){
      var bAllSongs = $('#songlistAll').hasClass('selected');
      $('#SongsHelpTextNoSongs').toggle(bAllSongs);
      $('#SongsHelpTextEmptySonglist').toggle(!bAllSongs);
    } else {
      $('#SongsHelpTextNoSongs').hide();
      $('#SongsHelpTextEmptySonglist').hide();
    }
  };
  
  this.selectAllSongsSonglist = function(event){
    document.getElementById('blur-hack').focus();
    $('#songListPartTheLists li input').removeClass('selected');
    $('#songlistAll').addClass('selected');
    $('#gallery').empty();
    
    if(event.originalEvent !== undefined)
      Troff.showSongsArea();


    DB.setCurrentSonglist(0);

    var aSongs = $('#newSongListPartAllSongs').children();
    
    for(var i=0; i<aSongs.length; i++){
      var songElement = aSongs.eq(i);
      var fullPath = songElement.attr('fullPath');
      var galleryId = songElement.attr('galleryId');
      if (songElement.attr('isDirectory') === "true"){
        var head = document.createElement("h3");
        head.appendChild(document.createTextNode( songElement.text() ));
        document.getElementById("gallery").appendChild(head);
        continue;
      }
      var pap = Troff.getMediaButton(fullPath, galleryId);
      document.getElementById("gallery").appendChild(pap);
    }
    Troff.showSongsHelpText();
  };

  
  this.addAllSongsFromGallery = function(galleryIdToAdd){
    var allSongs = $('#newSongListPartAllSongs')
      .children().filter('[isDirectory!=true]'); //slim sim, finns det en funktion fÃ¶r detta?

    for(var i=0; i<allSongs.length; i++){
      if(allSongs.eq(i).attr('galleryid') === galleryIdToAdd )
        Troff.addSongButtonToSongsList(
          allSongs.eq(i).attr('fullPath'),
          allSongs.eq(i).attr('galleryid')
        );
    }
  };
  
  this.addSongButtonToSongsList = function(fullPath, galleryId){
    //check if song is already added to the songsList
    var aAlreadyAddedSongs = $('#gallery').children().filter('button');
    for(var i=0; i<aAlreadyAddedSongs.length; i++){
      if(aAlreadyAddedSongs.eq(i).attr('fullpath') === fullPath &&
         aAlreadyAddedSongs.eq(i).attr('galleryid') === galleryId)
        return;
    }
    
    if(!checkIfSongExists(fullPath, galleryId)) 
      return;
    
    var pap = Troff.getMediaButton(fullPath, galleryId);
    document.getElementById("gallery").appendChild(pap);
  };
  
  this.showSongsArea = function(){
    if(!$('#songsTab').hasClass('active')) 
      $('#songsTab').click();
  };
  
  this.selectSonglist = function(event){
    document.getElementById('blur-hack').focus();
    $('#songListPartTheLists li input, #songlistAll').removeClass('selected');
    this.classList.add('selected');
    if(event.originalEvent !== undefined)
      Troff.showSongsArea();
    var li = this.parentNode;
    var stroSonglist = li.getAttribute('stroSonglist');
    var oSonglist = JSON.parse(stroSonglist);

    DB.setCurrentSonglist(oSonglist.id);
    $('#gallery').empty();
    
    var aSongs = oSonglist.songs;
    for(var i=0; i<aSongs.length; i++){
      if(aSongs[i].isDirectory){
        var header =  document.createElement("h3");
        var strHeader = Troff.getLastSlashName(aSongs[i].fullPath);
        header.appendChild(document.createTextNode(strHeader));
        document.getElementById("gallery").appendChild(header);
        Troff.addAllSongsFromGallery(aSongs[i].galleryId);
        continue;
      }
      else if(aSongs[i].header !== undefined){
        var oldHeader =  document.createElement("h3");
        var strOldHeader = Troff.getLastSlashName(aSongs[i].header);
        oldHeader.appendChild(document.createTextNode(strOldHeader));
        document.getElementById("gallery").appendChild(oldHeader);
        continue;
      }
      Troff.addSongButtonToSongsList(aSongs[i].fullPath, aSongs[i].galleryId);
    }
    Troff.showSongsHelpText();
  };

  this.getMediaButton = function(fullPath, galleryId){
    var pap = document.createElement("button");
    pap.setAttribute("class", "mediaButton onOffButton");
    var currGalleryId = Troff.getCurrentGalleryId();
    var currSong = Troff.getCurrentSong();
    if(fullPath == currSong && galleryId == currGalleryId)
      pap.classList.add('selected');
    pap.appendChild(document.createTextNode(Troff.pathToName(fullPath)));
    pap.setAttribute("fullPath", fullPath );
    pap.setAttribute("galleryId", galleryId );
    pap.addEventListener('click', Troff.selectSong );
    return pap;
  };
  
  this.editCurrentMarkerInfo = function(){
    var quickTimeOut = setTimeout(function(){
      document.getElementById("markerInfoArea").click();
      document.getElementById("markerInfoArea").focus();
      clearInterval(quickTimeOut);
    }, 0);
  };
  
/*  // depricated OK
  this.focusSongInfoArea = function(){
    $('#songinfoTab').click();
  };
*/
    
  this.enterSongInfo = function(a, b, c){
    $('#songInfoArea').addClass('textareaEdit');
    IO.setEnterFunction(function(event){
      if(event.ctrlKey==1){ //Ctrl+Enter will exit
        document.getElementById('blur-hack').focus();
        return false;
      }
      return true;
    });
  };

  this.exitSongInfo = function(){
    $('#songInfoArea').removeClass('textareaEdit');
    IO.clearEnterFunction();
//    document.getElementById('blur-hack').focus();
  };

  this.updateSongInfo = function(){
    var strInfo = $('#songInfoArea')[0].value;
    var songId = Troff.getCurrentSong();
    DB.setCurrentSongInfo(strInfo, songId);
  };
  
  this.rememberCurrentState = function(){
    document.getElementById('blur-hack').focus();
    var nrStates = $('#stateList').children().length + 1;
    IO.prompt(
      "Remember state of settings to be recalled later", 
      "State " + nrStates, 
      function(stateName){
      
      if(stateName === "") return;
        
      var state = {};
      state.name = stateName;
      state.buttPauseBefStart = $('#buttPauseBefStart').hasClass('active');
      state.pauseBeforeStart = $('#pauseBeforeStart').val();
      state.buttStartBefore = $('#buttStartBefore').hasClass('active');
      state.startBefore = $('#startBefore').val();
      state.buttStopAfter = $('#buttStopAfter').hasClass('active');
      state.stopAfter = $('#stopAfter').val();
      state.currentLoop = $('.currentLoop').attr('id');
      state.waitBetweenLoops = $('#waitBetweenLoops').val();
      state.buttWaitBetweenLoops= $('#buttWaitBetweenLoops').hasClass('active');
      state.volumeBar = $('#volumeBar').val();
      state.speedBar = $('#speedBar').val();
      state.currentMarker = $('.currentMarker').attr('id');
      state.currentStopMarker = $('.currentStopMarker').attr('id');
      
      Troff.addButtonsOfStates([JSON.stringify(state)]);
      DB.saveStates(Troff.getCurrentSong());
    });

  };
  
  this.addButtonsOfStates = function(astrState){
    for(var i=0; i<astrState.length; i++){
      var oState = JSON.parse(astrState[i]);
      
      $('<div>')
        .append(
          $('<input>')
          .attr('type', 'button')
          .addClass('small regularButton')
          .val('R')
          .click(Troff.removeState))
        .append(
          $('<input>')
          .attr('type', 'button')
          .addClass('regularButton')
          .val(oState.name)
          .click(Troff.setState))
        .attr('strState', astrState[i])
        .appendTo('#stateList');
    }
    if(astrState.length !== 0)
      $('#statesHelpText').hide();
  };
  
  this.setState = function(stateWrapper){
    var strState = $(stateWrapper.target).parent().attr('strState');
    var oState = JSON.parse(strState);
    if(oState.buttPauseBefStart !== $('#buttPauseBefStart').hasClass('active')){
      $('#buttPauseBefStart').click();
    }
    $('#pauseBeforeStart').val(oState.pauseBeforeStart);
    if(oState.buttStartBefore !== $('#buttStartBefore').hasClass('active')){
      $('#buttStartBefore').click();
    }
    $('#startBefore').val(oState.startBefore);
    if(oState.buttStopAfter !== $('#buttStopAfter').hasClass('active')){
      $('#buttStopAfter').click();
    }
    $('#stopAfter').val(oState.stopAfter);
    $('#' + oState.currentLoop).click();

    var bActiveWaitBetweenLoops = oState.buttWaitBetweenLoops;
    var iWaitBetweenLoops = oState.waitBetweenLoops;
    Troff.setWaitBetweenLoops(bActiveWaitBetweenLoops, iWaitBetweenLoops);
    $('#volumeBar').val(oState.volumeBar);
    $('#speedBar').val(oState.speedBar);
    Troff.speedUpdate();
    Troff.volumeUpdate();
    $('#' + oState.currentMarker).click();
    $('#' + oState.currentStopMarker).click();

    DB.saveSongDataFromState(Troff.getCurrentSong(), oState);
  };
  
  /* depricated OK
  this.focusMarkerInfoArea = function(){
    $('#markerinfoTab').click(); // depricated OK
  };
  */
  
  this.enterMarkerInfo = function(a, b, c){
    $('#markerInfoArea').addClass('textareaEdit');
    IO.setEnterFunction(function(event){
      if(event.ctrlKey==1){//Ctrl+Enter will exit
        document.getElementById('blur-hack').focus();
        return false;
      }
      return true;
    });
  };

  this.exitMarkerInfo = function(){
    $('#markerInfoArea').removeClass('textareaEdit');
    IO.clearEnterFunction();
//    document.getElementById('blur-hack').focus();
  };

    this.updateMarkerInfo = function(){
      var strInfo = $('#markerInfoArea')[0].value;
      var color = $('.currentMarker')[0].color;
      var markerId = $('.currentMarker').attr('id');
      var time = $('.currentMarker')[0].timeValue;
      var markerName = $('.currentMarker').val();
      var songId = Troff.getCurrentSong();
      
      $('.currentMarker')[0].info = strInfo;
      //Troff.exitMarkerInfo();
      
      DB.updateMarker(markerId, markerName, strInfo, color, time, songId);

    };

    this.addMarkers = function(aMarkers){

      // Slim sim remove!
      /*
        denna funktion , nedan, anvÃ¤nds fÃ¶r sista markÃ¶ren om den har tiden "max"
        det som ska tas bort Ã¤r alltsÃ¥ denna funktion och anropet till den.
        det Ã¤r tÃ¤mligen sjÃ¤lvfÃ¶rklarande om man sÃ¶ker efter funktionsnamnet...
        max-check Ã¤r redundant nÃ¤r alla lÃ¥tar (som har db-data sparat) 
        har Ã¶ppnats i v0.4 eller senare?
      */
      var tmpUpdateMarkerSoonBcMax = function(){
        DB.updateMarker(nameId, name, info, color, Number(time), song);
        clearInterval(quickTimeOut);
      };
      
      var startM = function() {
        Troff.selectMarker(this.id);
        document.getElementById('blur-hack').focus();
      };
      var stopM = function() {
        Troff.selectStopMarker(this.id);
        document.getElementById('blur-hack').focus();
      };
      var editM = function() {
        Troff.editMarker(this.id.slice(0,-1));
        document.getElementById('blur-hack').focus();
      };

      for(var i=0; i<aMarkers.length; i++) {
        var oMarker = aMarkers[i];
        var name = oMarker.name;
        var time = oMarker.time;
        var info = oMarker.info;
        var color = oMarker.color || "None";
        var nameId = oMarker.id;

        // slim sim remove!
        /*
          this entire if, below is used for debugging in the transition 
          between v0.3 to v0.4, can be removed before v0.4
          use for debugging new marker system with ID saved and passed around
          (instead of using marker-name...)
        */
        if(!nameId){
          //IO.alert("why is there no nameId (or markerId) with this marker!?");
          console.error("Why is there no nameId (or markerId) with this marker!?");
          console.error("i = " + i);
          console.error("aMarkers[i]:");
          console.error(aMarkers[i]);
          return -1;
        }
        
        var maxTime = Number(document.getElementById('timeBar').max);
        
        if(time == "max" || time > maxTime){
          time = maxTime;
          var song = Troff.getCurrentSong();
          var quickTimeOut = setTimeout(tmpUpdateMarkerSoonBcMax, 42);
        }

        var button = document.createElement("input");
        button.type = "button";
        button.id = nameId;
        button.value = name;
        button.classList.add('onOffButton');
        button.timeValue = time;
        button.info = info;
        button.color = color;

        var buttonS = document.createElement("input");
        buttonS.type = "button";
        buttonS.id = nameId + 'S';
        buttonS.value = 'Stop';
        buttonS.classList.add('onOffButton');
        buttonS.timeValue = time;

        var buttonE = document.createElement("input");
        buttonE.type = "button";
        buttonE.id = nameId + 'E';
        buttonE.value = 'E';
        buttonE.className = "small regularButton";

        var p = document.createElement("b");
        p.innerHTML = Troff.secToDisp(time);

        var docMarkerList = document.getElementById('markerList');
        var listElement = document.createElement("li");

        listElement.appendChild(buttonE);
        listElement.appendChild(p);
        listElement.appendChild(button);
        listElement.appendChild(buttonS);
        listElement.style.background = color;


        var child = $('#markerList li:first-child')[0];
        var bInserted = false;
        var bContinue = false;
        while(child) {
          var childTime = child.childNodes[2].timeValue;
          if(childTime !== undefined && Math.abs(time - childTime) < 0.001){
            var markerId = child.childNodes[2].id;
            
            if(child.childNodes[2].info != info){
              updated = true;
              var newMarkerInfo = child.childNodes[2].info + "\n\n" + info;
              $('#'+markerId)[0].info = newMarkerInfo;
              if($('.currentMarker')[0].id == child.childNodes[2].id)
                $('#markerInfoArea').val(newMarkerInfo);
            }
            if(child.style.background == "none"){
              updated = true;
              $('#'+markerId)[0].color = color;
              child.style.background = color;
            }
            if(child.childNodes[2].value != name){
              var newMarkerName = child.childNodes[2].value + ", " + name;
              updated = true;
              $('#'+markerId).val(newMarkerName);
            }
            
            bContinue = true;
            break;
          } else if (time < childTime){
            $('#markerList')[0].insertBefore(listElement,child);
            bInserted = true;
            break;
          } else {
            child = child.nextSibling;
          }
        } // end while

        if( bContinue ) continue;
        if ( !bInserted ) {
          docMarkerList.appendChild(listElement);
        }

        document.getElementById(nameId).addEventListener('click', startM);
        document.getElementById(nameId + 'S').addEventListener('click', stopM);
        document.getElementById(nameId + 'E').addEventListener('click', editM);
      }//end for-loop
      Troff.settAppropriateMarkerDistance();
    }; // end addMarker ****************/


    /*
     * returns the id of the earlyest and latest markers.
     * (note: latest marker without the 'S' for stop-id)
     */
    this.getFirstAndLastMarkers = function(){
      var aOMarkers = $('#markerList > li > :nth-child(3)');
      var max = parseFloat(aOMarkers[0].timeValue);
      var min = parseFloat(aOMarkers[0].timeValue);
      var iMaxIndex = 0;
      var iMinIndex = 0;
      var aMarkers = [];
      for(var i=0; i<aOMarkers.length; i++){
        var tv = aOMarkers[i].timeValue;
        aMarkers[i] = tv;

        if(parseFloat(aMarkers[i]) > max){
          iMaxIndex = i;
          max = parseFloat(aMarkers[i]);
        }
        if(parseFloat(aMarkers[i]) < min){
          iMinIndex = i;
          min = parseFloat(aMarkers[i]);
        }
      }
      return [aOMarkers[iMinIndex].id, aOMarkers[iMaxIndex].id];

    };


    this.unselectMarkers = function(){
      var aFirstAndLast = Troff.getFirstAndLastMarkers();
      var startMarkerId = aFirstAndLast[0];
      var stopMarkerId = aFirstAndLast[1] + 'S';

      $('.currentMarker').removeClass('currentMarker');
      $('#' + startMarkerId ).addClass('currentMarker');
      $('#markerInfoArea').val($('#'+startMarkerId)[0].info);
      $('.currentStopMarker').removeClass('currentStopMarker');
      $('#' + stopMarkerId).addClass('currentStopMarker');

      Troff.settAppropriateActivePlayRegion();
      document.getElementById('blur-hack').focus();

      DB.setCurrentStartAndStopMarker(startMarkerId, stopMarkerId, strCurrentSong);
    };

    this.unselectStartMarker = function(){
      var aFirstAndLast = Troff.getFirstAndLastMarkers();
      var startMarkerId = aFirstAndLast[0];
      var stopMarkerId = aFirstAndLast[1] + 'S';

      $('.currentMarker').removeClass('currentMarker');
      $('#' + startMarkerId).addClass('currentMarker');
      $('#markerInfoArea').val($('#'+startMarkerId)[0].info);

      Troff.settAppropriateActivePlayRegion();
      document.getElementById('blur-hack').focus();
      DB.setCurrentStartMarker(startMarkerId, strCurrentSong );
    };
    
    this.unselectStopMarker = function(){
      var aFirstAndLast = Troff.getFirstAndLastMarkers();
      var startMarkerId = aFirstAndLast[0];
      var stopMarkerId = aFirstAndLast[1] + 'S';

      $('.currentStopMarker').removeClass('currentStopMarker');
      $('#' + stopMarkerId).addClass('currentStopMarker');

      Troff.settAppropriateActivePlayRegion();
      document.getElementById('blur-hack').focus();
      DB.setCurrentStopMarker(stopMarkerId, strCurrentSong );
    };

    /*
      selectMarker - All, sets new Marker, sets playtime to markers playtime
    */
    this.selectMarker = function(markerId){
      var startTime = Number($('#'+markerId)[0].timeValue);
      var stopTime = Troff.getStopTime();
      
      // if stopMarker befor Marker - unselect stopMarker:
      if(stopTime <= (startTime +0.5)){
        $('.currentStopMarker').removeClass('currentStopMarker');
        var aFirstAndLast = Troff.getFirstAndLastMarkers();
        var firstMarkerId = aFirstAndLast[0];
        var lastMarkerId = aFirstAndLast[1] + 'S';

        $('#' + lastMarkerId).addClass('currentStopMarker');
      }
      var stopMarker = $('.currentStopMarker').attr('id');
      stopMarker = stopMarker ? stopMarker : 0;

      //marks selected Marker:
      $('.currentMarker').removeClass('currentMarker');
      $('#'+markerId).addClass('currentMarker');
      $('#markerInfoArea').val($('#'+markerId)[0].info);
      
      Troff.goToStartMarker();
      
      Troff.settAppropriateActivePlayRegion();

      DB.setCurrentStartAndStopMarker(markerId, stopMarker, strCurrentSong);
    }; // end selectMarker

    /*
      selectStopMarker - All, selects a marker to stop playing at
    */
    this.selectStopMarker = function(markerId){
      var stopTime = Number($('#'+markerId)[0].timeValue);
      var startTime = Troff.getStartTime();

      // if Marker after stopMarker - unselect Marker:
      if((startTime + 0.5) >= stopTime ){
        var aFirstAndLast = Troff.getFirstAndLastMarkers();
        var firstMarkerId = aFirstAndLast[0];
        var lastMarkerId = aFirstAndLast[1] + 'S';

        $('.currentMarker').removeClass('currentMarker');
        $('#' + firstMarkerId).addClass('currentMarker');
        $('#markerInfoArea').val($('#'+firstMarkerId)[0].info);
      }

      var startMarker = $('.currentMarker').attr('id');
      startMarker = startMarker ? startMarker : 0;

      //marks selected StopMarker:
      $('.currentStopMarker').removeClass('currentStopMarker');
      $('#'+markerId).addClass('currentStopMarker');

      Troff.settAppropriateActivePlayRegion();
      DB.setCurrentStartAndStopMarker(startMarker, markerId, strCurrentSong);

    }; // end selectStopMarker

    this.selectPauseBefStart = function(bActive, iPauseBefStart){
        $('#pauseBeforeStart').val(iPauseBefStart);
        if(bActive){
            $('#buttPauseBefStart').addClass('active');
            $('#pauseBeforeStart').removeClass('grayOut');
        } else {
            $('#buttPauseBefStart').removeClass('active');
            $('#pauseBeforeStart').addClass('grayOut');
        }
        Troff.updateSecondsLeft();
    };

    this.toggleStartBefore = function(){
      $('#buttStartBefore').toggleClass('active');
      $('#startBefore').toggleClass('grayOut');
      Troff.updateStartBefore();
      Troff.setCurrentStartBefore();
      
      Troff.settAppropriateActivePlayRegion();
      document.getElementById('blur-hack').focus();
    };
    
    this.selectStartBefore = function(bActive, iStartBefore){
        $('#startBefore').val(iStartBefore);
        if(bActive){
            $('#buttStartBefore').addClass('active');
            $('#startBefore').removeClass('grayOut');
        } else {
            $('#buttStartBefore').removeClass('active');
            $('#startBefore').addClass('grayOut');
        }
    };

    this.selectStopAfter = function(bActive, iStopAfter){
        $('#stopAfter').val(iStopAfter);
        if(bActive){
            $('#buttStopAfter').addClass('active');
            $('#stopAfter').removeClass('grayOut');
        } else {
            $('#buttStopAfter').removeClass('active');
            $('#stopAfter').addClass('grayOut');
        }
    };

  this.removeState = function(){
    var that = this;
    IO.confirm("Remove state",
      "This action can not be undone", 
      function(){
      $(that).parent().remove();
      DB.saveStates(Troff.getCurrentSong());
      if($('#stateList >').length === 0)
        $('#statesHelpText').show();
    });
  };
  
    /*
      removeMarker, all, Tar bort en markÃ¶r frÃ¥n html och DB
    */
    this.removeMarker = function(markerId){
      // Remove Marker from HTML
      $('#'+markerId).closest('li').remove();
      Troff.settAppropriateMarkerDistance();

      // remove from DB
      DB.saveMarkers(Troff.getCurrentSong());
    }; // end removeMarker ******/


/*
OK -- fixa att tangentbordet funkar bÃ¤ttre med denna popup
OK -- i pup-uppen, stÃ¶rre ruta fÃ¶r tidsinput?
OK -- tiden borde ocksÃ¥ uppdateras
OK -- om tvÃ¥ markÃ¶rer hamnar pÃ¥ samma tid sÃ¥ borde dom mergas, Ã¥teranvÃ¤nda funktionalitet? - finns inte fÃ¶r annan flytt...
man skulle kunna ha ett val, "flytta alla markÃ¶rer" / flytta bara dom "mellan start och stop" (inklusive start o stopp)
*/

    this.toggleMoveMarkersMoreInfo = function(){
      $('#moveMarkersMoreInfoDialog').toggle();
      document.getElementById('blur-hack').focus();
    };

    /*
      show the move markers pop up dialog. 
    */
    this.showMoveMarkers = function(){
      IO.setEnterFunction(function(){
        Troff.moveMarkers();
      });
      $('#moveMarkersDialog').show();
      $('#moveMarkersNumber').select();
    };

    /*
      hide the move markers pop up dialog. 
    */
    this.hideMoveMarkers = function(){
      $('#moveMarkersDialog').hide();
      $('#moveMarkersMoreInfoDialog').hide();
      $('#moveMarkersNumber').val(0);
      IO.clearEnterFunction();
    };

    /*
      move all or some markers. 
    */
    this.moveAllMarkersUp = function(){
      $('#moveMarkersNumber').val(- $('#moveMarkersNumber').val());
      Troff.moveMarkers(false, false);
    };
    this.moveAllMarkersDown = function(){
      Troff.moveMarkers(false, false);
    };
    this.moveSomeMarkersUp = function(){
      $('#moveMarkersNumber').val(- $('#moveMarkersNumber').val());
      Troff.moveMarkers(true, false);
    };
    this.moveSomeMarkersDown = function(){
      Troff.moveMarkers(true, false);
    };
    
    this.moveOneMarkerDown = function(val){
      $('#moveMarkersNumber').val( val );
      Troff.moveMarkers(true, true);
    };
    
    /*
      move all markers. 
    */
    this.moveMarkers = function(bMoveSelected, bOneMarker){
      $('#moveMarkersDialog').hide();
      IO.clearEnterFunction();
      
      var value = $('#moveMarkersNumber').val();
      $('#moveMarkersNumber').val( 0 );

      var aAllMarkers = Troff.getCurrentMarkers();
      
      if(bOneMarker){
        bMoveSelected = true;
        aAllMarkers = $('.currentMarker');
      }

      var startNumber = 0;
      var endNumber = aAllMarkers.length;
      
      if(bMoveSelected){
        for(var k=0; k<aAllMarkers.length; k++){
          var selectedId = $('.currentMarker').attr('id');
          var selectedStopId = $('.currentStopMarker').attr('id');
          if(selectedId == aAllMarkers.eq(k).attr('id'))
            startNumber = k;
  
          var nextAttrId = aAllMarkers.eq(k).next().attr('id');
          var attrId = aAllMarkers.eq(k).attr('id');
          if(selectedStopId == aAllMarkers.eq(k).next().attr('id'))
            endNumber = k+1;
        }
      }

      for(var i=startNumber; i<endNumber; i++){
        var markerId = aAllMarkers[i].id;
        
        var markerTime = Number(aAllMarkers[i].timeValue) + Number(value);
        var maxTime = Number(document.getElementById('timeBar').max);
        var newTime = Math.max(0, Math.min(maxTime, markerTime) );
        
        for(var j=0; j<i; j++){
          if(aAllMarkers[j].timeValue == newTime){
            var newMarkerName = $('#'+markerId).val();
            if(newMarkerName != aAllMarkers.eq(j).val())
              newMarkerName += ", " + aAllMarkers.eq(j).val();
            $('#'+markerId).val( newMarkerName );

            var newMarkerInfo = $('#'+markerId)[0].info;
            if(newMarkerInfo !=  aAllMarkers[j].info)
              newMarkerInfo += "\n\n" + aAllMarkers[j].info;
            $('#'+markerId)[0].info = newMarkerInfo;
            if( $('#' + markerId).hasClass('currentMarker') )
              $('#markerInfoArea').val(newMarkerInfo);

            aAllMarkers.eq(j).parent().remove();
          }
        }
        
        $('#'+markerId)[0].timeValue = newTime;
        $('#'+markerId + 'S')[0].timeValue = newTime;
        $('#'+markerId).prev().html( Troff.secToDisp(newTime) );
      }
      
      Troff.settAppropriateMarkerDistance();
      DB.saveMarkers(Troff.getCurrentSong() );
    };

    /*
      editMarker, all, Editerar en markÃ¶r i bÃ¥de html och DB
    */
    this.editMarker = function(markerId){
      var oldName  = $('#'+markerId).val();
      var oldTime = Number($('#'+markerId)[0].timeValue);
      var oldMarkerInfo = $('#'+markerId)[0].info;
      var oldMarkerColor = $('#'+markerId)[0].color;

      var text = "Please enter new marker name here";
      IO.promptEditMarker(markerId, function(newMarkerName, newMarkerInfo, newMarkerColor, newTime){

      if(newMarkerName === null || newMarkerName === "" ||
        newTime === null || newTime === "" )
      {
        return;
      }

      if( newTime < 0 )
        newTime = 0;
      if( newTime > $('audio, video')[0].duration )
        newTime = $('audio, video')[0].duration;


      var updated = false;


      // Update HTML Name
      if(newMarkerName != oldName){
          updated = true;
          $('#'+markerId).val(newMarkerName);
      }

      // update HTML Info
      if(newMarkerInfo != oldMarkerInfo){
        updated = true;
        $('#'+markerId)[0].info = newMarkerInfo;
        
        if( $('#' + markerId).hasClass('currentMarker') )
          $('#markerInfoArea').val(newMarkerInfo);
      }
      if(newMarkerColor != oldMarkerColor){
        updated = true;
        $('#'+markerId)[0].color = newMarkerColor;
        $('#'+markerId)[0].parentNode.style.background = newMarkerColor;
      }

      // update HTML Time
      if(newTime != oldTime){
        updated = true;

        $('#'+markerId)[0].timeValue = newTime;
        $('#'+markerId + 'S')[0].timeValue = newTime;
        Troff.settAppropriateMarkerDistance();

        var startTime = Number($('.currentMarker')[0].timeValue);
        var stopTime = Number($('.currentStopMarker')[0].timeValue);

        if( startTime >= stopTime ){
          $('.currentStopMarker').removeClass('currentStopMarker');
          Troff.settAppropriateActivePlayRegion();
        }
        $('#'+markerId).prev().html( Troff.secToDisp(newTime) );
      }

      // update name and time and info and color in DB, if nessessarry
      if(updated){
        DB.updateMarker(
          markerId,
          newMarkerName,
          newMarkerInfo,
          newMarkerColor,
          Number(newTime),
          strCurrentSong
        );
        /*
        note: DB.updateMarker will also update the "currentStartMarker" and the
        currentStopMarker, if the updated marker is the start or stop marker.
        */
      }

      }); // end prompt-Function
    }; // end editMarker ******/

    /*
      clearAllStates - HTML, clears states
    */
    this.clearAllStates = function(){
      $('#stateList').empty();
      $('#statesHelpText').show();
    }; // end clearAllStates
    
    /*
      clearAllMarkers - HTML, clears markers
    */
    this.clearAllMarkers = function(){
      $('#markerSection').css("height", (window.innerHeight + "px"));
      $('#markerSection').css("margin-top", (0 + "px"));
      var docMarkerList = document.getElementById('markerList');
      if (docMarkerList) {
        while (docMarkerList.firstChild) {
          docMarkerList.removeChild(docMarkerList.firstChild) ;
        }
      }
    }; // end clearAllMarkers

    this.settAppropriateActivePlayRegion = function () {
      var aFirstAndLast = Troff.getFirstAndLastMarkers();
      var firstMarkerId = aFirstAndLast[0];
      var lastMarkerId = aFirstAndLast[1] + 'S';
      if( $('.currentMarker').length === 0 ){
        $('#' + firstMarkerId).addClass('currentMarker');
        $('#markerInfoArea').val( $('#' + firstMarkerId)[0].info);
      }
      if( $('.currentStopMarker').length === 0 )
        $('#' + lastMarkerId).addClass('currentStopMarker');


      var timeBarHeight = $('#timeBar').height() - 12;
      var barMarginTop = parseInt($('#timeBar').css('margin-top')) + 6;

      var startTime = Troff.getStartTime();
      var stopTime = Troff.getStopTime();
      var songTime = $('audio, video')[0].duration;

      var height = (stopTime - startTime) * timeBarHeight / songTime;
      var top = startTime * timeBarHeight / songTime + barMarginTop;

      $('#activePlayRegion').height(height);
      $('#activePlayRegion').css("margin-top", top + "px");
    }; // end setAppropriateActivaePlayRegion

    this.settAppropriateMarkerDistance = function () {
        var child = $('#markerList li:first-child')[0];
      
        var timeBarHeight = $('#timeBar').height() - 10;
        var totalDistanceTop = 4;

        var barMarginTop = parseInt($('#timeBar').css('margin-top'));
        while(child){
            var songTime = document.querySelector('audio, video').duration;
            var markerTime = child.childNodes[2].timeValue;
            var myRowHeight = child.clientHeight;

            var freeDistanceToTop = timeBarHeight * markerTime / songTime;

            var marginTop = freeDistanceToTop - totalDistanceTop + barMarginTop;
            totalDistanceTop = freeDistanceToTop + myRowHeight + barMarginTop;

            child.style.marginTop = marginTop + "px";
            child = child.nextSibling;
        }
        Troff.settAppropriateActivePlayRegion();
    }; // end settAppropriateMarkerDistance
    
    this.selectNext = function(reverse){
      var markers = $('#markerList').children();
      
      var currentMarkerTime = Number($('.currentMarker')[0].timeValue, 10);
      var currentStopTime = Number($('.currentStopMarker')[0].timeValue, 10);
      markers.sort(function(a, b){
        return a.childNodes[2].timeValue - b.childNodes[2].timeValue;
      });

      var bSelectNext = false;
      var bSelectNextStop = false;
      
      if(reverse){
        for(var i=markers.length-1; i>-1; i--) {
          checkOrSelect(i);
        }
      } else {
        for(var j = 0; j < markers.length; j++) {
          checkOrSelect(j);
        }
      }
      
      function checkOrSelect(i){
        if(bSelectNextStop){
          $(markers[i].childNodes[3]).click();
          bSelectNextStop = false;
        }
        if(markers[i].childNodes[3].timeValue == currentStopTime){
          bSelectNextStop = true;
        }
        if(bSelectNext){
          $(markers[i].childNodes[2]).click();
          bSelectNext = false;
        }
        if(markers[i].childNodes[2].timeValue == currentMarkerTime){
          bSelectNext = true;
        }
      }
    };

    
    this.zoomDontShowAgain = function(){
      $('#zoomInstructionDialog').hide();
      Troff.dontShowZoomInstructions = true;
      DB.setZoomDontShowAgain();
      IO.clearEnterFunction();
    };
    
    this.zoomDialogOK = function(){
      $('#zoomInstructionDialog').hide();
      IO.clearEnterFunction();
    };
    
    this.zoomOut = function(){
      document.getElementById('blur-hack').focus();
      Troff.zoom(0, Number(document.getElementById('timeBar').max));
    };
    /*
    this.setZoomTimes = function(startTime, endTime){
      m_zoomStartTime = startTime;
      m_zoomEndTime = endTime;
    };
    */
    this.zoomToMarker = function(){
      document.getElementById('blur-hack').focus();
      var startTime = Troff.getStartTime();
      var endTime = Troff.getStopTime();
      if(startTime === m_zoomStartTime && endTime == m_zoomEndTime){
        if(!Troff.dontShowZoomInstructions){
          IO.setEnterFunction(Troff.zoomDialogOK);
          $('#zoomInstructionDialog').show();
        }
      }
      Troff.zoom(startTime, endTime);
    };
    
    this.zoom = function(startTime, endTime){

      //NOTE all distances is in vh, unless otherwise specified
/*
      var w = window;
      var d = document;
      var e = d.documentElement;
      var g = d.getElementsByTagName('body')[0];
      //var winWidth = w.innerWidth || e.clientWidth || g.clientWidth,
//      var winHeightPX = w.innerHeight|| e.clientHeight || g.clientHeight;
*/

      m_zoomStartTime = startTime;
      m_zoomEndTime = endTime;
      
      DB.saveZoomTimes(strCurrentSong, startTime, endTime);
      
      var winHeightPX = window.innerHeight;
      
      var mPX = parseInt($('#timeBar').css('marginTop'));
      
      var mDiv = 8;//parseInt($('#timeBar').css('marginTop'))
      
      var oH = 100; //original Height of div
      var m = (mPX + mDiv) * oH / winHeightPX; // original margin between timebar and div
      var mT = 2 * m; //total margin
      var oh = oH - mT;//original Height of timebar

      var tL = Number(document.getElementById('timeBar').max);
      var t1 = startTime / tL;
      var t2 = endTime / tL;
      
      var zt = 1 / (t2 - t1); // == tL/(endTime - startTime);
      var zd = (zt * oh + mT)/oH;
      var mt = t1 * oh * zt;
      
      var height = 100 * zd;
      var marginTop = -mt;
      $('#markerSection').css("height", (height + "vh"));
      $('#markerSection').css("margin-top", (marginTop + "vh"));
      Troff.settAppropriateMarkerDistance();
    };

    this.tappTime = function(){
        previousTime = time;
        time = new Date().getTime() / 1000;
        document.getElementById('blur-hack').focus();

        if(time - previousTime > 3){
            startTime = previousTime = time;
            nrTapps = 0;
        }
        else {
            nrTapps++;
        }
        tappedTime = time - startTime;
        $('#tappTempo-value').text( Math.round ( nrTapps * 60 / tappedTime ) );

        if(Troff.tempoTimeout) clearInterval(Troff.tempoTimeout);

        Troff.tempoTimeout = setTimeout(Troff.saveTempo, 3000);
    };

    this.saveTempo = function(){
        DB.setCurrentTempo($('#tappTempo-value').text(), strCurrentSong );
    };

    this.setTempo = function( tempo ){
        $('#tappTempo-value').text( tempo );
    };

    /* standAlone Functions */
    this.secToDisp = function(seconds){
        var sec = ( seconds | 0 ) % 60;
        if ( sec < 10 )
            sec = "0"+sec;
        var min = (seconds / 60) | 0;
        return min + ':' + sec;
    };

    this.incrementInput = function(identifyer, amount, cbFunk){
        $(identifyer ).val( parseInt($(identifyer).val()) + amount );
        $(identifyer).trigger("change");
        if(cbFunk) cbFunk();
    };

    /* end standAlone Functions */


  
  
  
  
  
  

  
  
  
}; // end TroffClass




var RateClass = function(){
  this.RATED_STATUS_NOT_ASKED = 1;
  this.RATED_STATUS_NO_THANKS = 2;
  this.RATED_STATUS_ASK_LATER = 3;
  this.RATED_STATUS_ALREADY_RATED = 4;
  
  this.startFunc = function(){
    chrome.storage.sync.get([
      'millisFirstTimeStartingApp',
      'iRatedStatus',
      'straLastMonthUsage'
    ], function(oData){
       // Check if it is the first time user starts the App

      if(!oData.millisFirstTimeStartingApp){
        Troff.firstTimeUser();
        Rate.firstTimeStartingAppFunc();
        return;
      }
      
      if(oData.iRatedStatus == Rate.RATED_STATUS_ALREADY_RATED) return;

      var millisOneMonth = 2678400000; // nr of millisecunds in a month!
      var aLastMonthUsage = JSON.parse(oData.straLastMonthUsage);
      
      var d = new Date();
      var millis = d.getTime();
      aLastMonthUsage.push(millis);

      // update the user statistics
      aLastMonthUsage = aLastMonthUsage.filter(function(element){
        return element > millis - millisOneMonth;
      });
      chrome.storage.sync.set(
        {'straLastMonthUsage' : JSON.stringify(aLastMonthUsage)}
      );
      
      // return if no conection
      if(!navigator.onLine) return;
      
      // return if user has used the app for less than 3 months
      if(millis - oData.millisFirstTimeStartingApp < 3*millisOneMonth ) return;
      
      // return if user has used Troff less than 4 times durring the last month
      if(aLastMonthUsage.length < 4) return;
      
      if(oData.iRatedStatus == Rate.RATED_STATUS_NOT_ASKED) {
        Rate.showRateDialog();
      }
      if(oData.iRatedStatus == Rate.RATED_STATUS_ASK_LATER) {
        if(Math.random() < 0.30)
          Rate.showRateDialog();
      }
      
      if(oData.iRatedStatus == Rate.RATED_STATUS_NO_THANKS) {
        if(aLastMonthUsage.length < 20) return;
        if(Math.random() < 0.05){
          Rate.showRateDialog();
        }
      }
    });
  };
  

  this.firstTimeStartingAppFunc = function(){
    var d = new Date();
    var millis = d.getTime();
    var aLastMonthUsage = [millis];
    var straLastMonthUsage = JSON.stringify(aLastMonthUsage);
    chrome.storage.sync.set({
      'millisFirstTimeStartingApp' : millis,
      'iRatedStatus' : Rate.RATED_STATUS_NOT_ASKED,
      'straLastMonthUsage' : straLastMonthUsage
    });
  };
  
  this.showRateDialog = function(){
    IO.setEnterFunction(function(){
      Rate.rateDialogRateNow();
    });
    if(navigator.onLine){
      $('#rateDialog').show();
    }
  };
  
  this.rateDialogNoThanks = function(){
    document.getElementById('blur-hack').focus();
    IO.clearEnterFunction();
    $('#rateDialog').hide();
    chrome.storage.sync.set({'iRatedStatus' : Rate.RATED_STATUS_NO_THANKS});
  };
  this.rateDialogAskLater = function(){
    document.getElementById('blur-hack').focus();
    IO.clearEnterFunction();
    $('#rateDialog').hide();
    chrome.storage.sync.set({'iRatedStatus' : Rate.RATED_STATUS_ASK_LATER});
  };
  this.rateDialogRateNow = function(){
    document.getElementById('blur-hack').focus();
    IO.clearEnterFunction();
    $('#rateDialog').hide();
    chrome.storage.sync.set({'iRatedStatus' : Rate.RATED_STATUS_ALREADY_RATED});
    
    var strChromeWebStore = 'https://chrome.google.com/webstore/detail/';
    var strTroffName = 'troff-training-with-music/';
    var strTroffIdReview = 'mebbbmcjdgoipnkpmfjndbolgdnakppl/reviews';
    window.open(strChromeWebStore + strTroffName + strTroffIdReview);
  };
};



var DBClass = function(){
  
  this.cleanSong = function(songId, songObject){


    if(songId === "strCurrentSongPath"){
      var path = songObject;
      var galleryId = -1;
      var stroSong = JSON.stringify({"strPath":path, "iGalleryId": galleryId});
      chrome.storage.local.set({'stroCurrentSongPathAndGalleryId': stroSong});
      chrome.storage.local.remove("strCurrentSongPath");
      return; //It is returning here because songId === strCurrentSongPath is 
              //not a song to be cleened, this was a attribute used before v0.4
    }





/*
    // this if-thing is only here to ease the transition from v 0.2.0.1 to next step.
    // at 2015-02-19, and a later patch at 2015-04-sometime... 
    // this should be removed an around 2015-04??? is 2 months enough? no! not nearly enouth...
    // all the way down to XXX-here-XXX
    
    function countObjectLength(foo){
      var count = 0;
      for (var k in foo) {
          if (foo.hasOwnProperty(k)) {
             ++count;
          }
      }
      return count;
    }
    function markerNameToId(name){
      console.log("is this used?");
        var ret = name.replace(/\s+/g, '_'); //removes blanks (if needed)
        ret = ret.replace(/[^A-Za-z0-9 ]/g, '');
        return ret;
    }
    if(songObject.currentStartMarker == "#Start" || songObject.currentStartMarker == 0 ) songObject.currentStartMarker = "Start";
    if(songObject.currentStopMarker == "#EndS" || songObject.currentStopMarker == 0) songObject.currentStopMarker = "EndS";
    // bStart o bEnd kollar om start och stopp Ã¤r tillagda bland de sparade markÃ¶rerna
    // om de Ã¤r det sÃ¥ ska de ju inte lÃ¤ggas till igen...
    var bStart = false;
    var bEnd = false;
    for(var j=0; j<songObject.markers.length; j++){
      if( songObject.markers[j]['Start'] != undefined ) bStart = true;
      if( songObject.markers[j]['End'] != undefined ) bEnd = true;
    }
    if(
      songObject.markers.length < 2
      ||
      ( songObject.currentStartMarker == "Start" && !bStart )
      ||
      ( songObject.currentStopMarker == "EndS" && !bEnd )
    )
    {
      var first = songObject.currentStartMarker == "Start" && !bStart ;
      var second = songObject.currentStopMarker == "EndS" && !bEnd ;
      var songLength = "max"; //"max" is a code that sets the marker to the end of the song when the marker is added.

      songObject.markers.push({"Start":0}); // Yes, this is the old-marker-DB-layout,
      songObject.markers.push({"End":songLength}); // but it shoult be like that, 
      // because the conversion from the old- layout to the new layout is taken care of below!
    }

    var iMarkers = songObject.markers.length;
    for(var i=0; i<iMarkers; i++){
       if(countObjectLength(songObject.markers[i]) == 1){
        var name = Object.keys(songObject.markers[i])[0];
        var time = songObject.markers[i][name];
        if(time !== "max") 
          time = Number(time);
        var id = "markerNr" + i;
        var info = "";
        var color = "None";
        if(i===0){
          info = Troff.getStandardMarkerInfo();
        }
        
        if(
            markerNameToId(name) == songObject.currentStartMarker ||
            name == songObject.currentStartMarker
            ){
          songObject.currentStartMarker = id;
          
        } else {
          for(var l=0; l<101; l++){
            if( 
                (markerNameToId(name) + l ) == songObject.currentStartMarker ||
                (name + l) == songObject.currentStartMarker 
                ){
              songObject.currentStartMarker = id;
              break;
            }
          }
        }
        if( 
            (markerNameToId(name) + 'S') == songObject.currentStopMarker ||
            (name + 'S') == songObject.currentStopMarker
            ){
          songObject.currentStopMarker = id + 'S';
        } else {
          for(var k=0; k<101; k++){
            if( 
                (markerNameToId(name) + k + 'S') == songObject.currentStopMarker ||
                (name + k + 'S') == songObject.currentStopMarker
                ){
              songObject.currentStopMarker = id + 'S';
              break;
            }
          }
        }
        
        var oMarker = {};
        oMarker.name  = name;
        oMarker.time  = time;
        oMarker.id    = id;
        oMarker.info  = info;
        oMarker.color = color; 
        
        songObject.markers[i] = oMarker;
      }
    }
    
    // remove from up there to here XXX-here-XXX */
    
    console.log("cleanSong ->");
    songObject = DB.fixSongObject(songObject);
    
    
    
    var obj = {};
    obj[songId] = songObject;
    chrome.storage.local.set(obj);
  }; // end cleanSong
  
  this.fixSongObject = function(songObject, maxTime){
    if (songObject === undefined) songObject = {};
    if (maxTime === undefined) maxTime = "max";
    
    if(songObject.hasOwnProperty('iWaitBetweenLoops')){
      songObject.wait = songObject.iWaitBetweenLoops;
      delete songObject.iWaitBetweenLoops;
    } 
  
    var oMarkerStart = {};
    oMarkerStart.name = "Start";
    oMarkerStart.time = 0;
    oMarkerStart.info = Troff.getStandardMarkerInfo();
    oMarkerStart.color = "None";
    oMarkerStart.id = "markerNr0";
    var oMarkerEnd = {};
    oMarkerEnd.name  = "End";
    oMarkerEnd.time  = maxTime;
    oMarkerEnd.info  = "";
    oMarkerEnd.color = "None";
    oMarkerEnd.id = "markerNr1";
  
    if(!songObject.startBefore) songObject.startBefore = [false, 4];
    if(!songObject.stopAfter) songObject.stopAfter = [false, 2];
    if(!songObject.pauseBefStart) songObject.pauseBefStart = [true, 3];
    if(!songObject.speed) songObject.speed = 100;
    if(!songObject.volume) songObject.volume = 100;
    if(!songObject.loopTimes) songObject.loopTimes = 1;
    if(!songObject.wait) songObject.wait = [true, 1];
    if(!$.isArray(songObject.wait)) songObject.wait = [true, songObject.wait];
    if(!songObject.info ) songObject.info = "";
    if(!songObject.tempo) songObject.tempo = "?";
    if(songObject.tempo == "NaN") songObject.tempo = "?";
    if(songObject.loopTimes > 9) songObject.loopTimes = "inf";
    if(songObject.aStates === undefined) songObject.aStates = [];
    if(!songObject.zoomStartTime) songObject.zoomStartTime = 0;
    if(!songObject.zoomEndTime) songObject.zoomEndTime = maxTime;
    else if(songObject.zoomEndTime == "max") songObject.zoomEndTime = maxTime;
    if(!songObject.markers) songObject.markers = [oMarkerStart, oMarkerEnd];
    if(!songObject.abAreas) 
      songObject.abAreas = [false, true, false, true, true, true];
    if(!songObject.currentStartMarker) 
      songObject.currentStartMarker = oMarkerStart.id;
    if(!songObject.currentStopMarker)
      songObject.currentStopMarker = (oMarkerEnd.id + 'S');
    
    return songObject;
  };
  


  this.cleanDB = function(){
    chrome.storage.local.get(null, function(items) {
      var allKeys = Object.keys(items);
      if(allKeys.length === 0){ // This is the first time Troff is started:
        DB.saveSonglists();
        DB.setCurrentSonglist(0);
//depricated OK       DB.setCurrentTab("songs"); 
      }
      // These is fore the first time Troff is started:
      if(allKeys.indexOf("straoSongLists")   === -1 ) DB.saveSonglists();
      if(allKeys.indexOf("iCurrentSonglist") === -1 ) DB.setCurrentSonglist(0);
//      if(allKeys.indexOf("abCurrentAreas")   === -1 ) DB.setCurrentAreas(); //depricated
      if(allKeys.indexOf("zoomDontShowAgain")=== -1 ) {
        chrome.storage.local.set({"zoomDontShowAgain" : false});
      }
      
//depricated OK     if(allKeys.indexOf("strCurrentTab")    === -1 ) DB.setCurrentTab("songs");


      // Slim sim remove 
      /*
        This following if is only to ease the transition between v0.5 to v1.0
        It is not used a single time after they open the app with v1.0 
        so the standard is without the if...
      */
      if(allKeys.indexOf("strCurrentTab") !== -1 ){
        chrome.storage.local.remove("strCurrentTab");
        delete items.strCurrentTab;
      }
      
      
      // Slim sim remove 
      /*
        This following if is only ever used in the test-version
        It is not used a single time after they open the app with this test 
        version
        so the standard is without the if...
        it is extremely safe to remove....
      */
      if( allKeys.indexOf("abCurrentAreas") !== -1 ){
        chrome.storage.local.remove("abCurrentAreas");
        delete items.strCurrentTab;
      }


      for(var key in items){
        if( // skipping all non-songs from DB:
          key === "stroCurrentSongPathAndGalleryId" ||
          key === "iCurrentSonglist" ||
          key === "zoomDontShowAgain" ||
          key === "straoSongLists"
        ) continue;
        DB.cleanSong(key, items[key]);
      }
    });//end get all keys
  };
  
  this.saveSonglists = function(){
    var aoSonglists = [];
    
    var aDOMSonglist = $('#songListPartTheLists li');
    for(var i=0; i<aDOMSonglist.length; i++){
      aoSonglists.push(JSON.parse(aDOMSonglist[i].getAttribute('stroSonglist')));
    }
    $('#songlistHelpText').toggle($('#songListPartTheLists >').length === 0);
    

    var straoSonglists = JSON.stringify(aoSonglists);
    chrome.storage.local.set({'straoSongLists': straoSonglists});
  };

  this.setCurrentAreas = function(songId){
    chrome.storage.local.get(songId, function(ret) {
      var song = ret[songId];
      if(!song){
        console.error('Error "setStartAndStopMarker, noSong" occurred, songId='
          +songId);
        return;
      }
      var aButts = $('#areaSelector').children();
      var aListToSave = [];
      for ( var i = 0; i < aButts.length; i++){
        aListToSave[i] = aButts.eq(i).hasClass('active');
      }
      song.abAreas = aListToSave;

/*    
    trye to use something like this:
                  this.setCurrentStartAndStopMarker = function(startMarkerId, stopMarkerId,
                                                           songId){
                  chrome.storage.local.get(songId, function(ret){
                    var song = ret[songId];
                    if(!song){
                        console.error('Error "setStartAndStopMarker, noSong" occurred,'+
                                        ' songId=' +songId);
                        return;
                    }
                    song.currentStartMarker = startMarkerId;
                    song.currentStopMarker = stopMarkerId;
                    var obj = {};
                    obj[songId] = song;
                    chrome.storage.local.set(obj);
                  });
                  };//end setCurrentStartAndStopMarker

*/
    
    /* depricated
    var abCurrentAreas = [];
    $('#areaSelector').children().each(function(index, element){
      abCurrentAreas.push($(element).hasClass('active'));
    });
    chrome.storage.local.set({'abCurrentAreas': abCurrentAreas});
    */

      var obj = {};
      obj[songId] = song;
      chrome.storage.local.set(obj);
    });
  };
  

/*//depricated OK
  this.setCurrentTab = function(tab, songId){
    console.error("setCurrentTag ->");
    chrome.storage.local.set({'strCurrentTab': tab});
  };
  */
  this.setCurrentSonglist = function(iSonglistId){
    chrome.storage.local.set({'iCurrentSonglist': iSonglistId});
  };

  this.setCurrentSong = function(path, galleryId){
    var stroSong = JSON.stringify({"strPath":path, "iGalleryId": galleryId});
    chrome.storage.local.set({'stroCurrentSongPathAndGalleryId': stroSong});
  };
  
  this.setZoomDontShowAgain = function(){
    chrome.storage.local.set({"zoomDontShowAgain" : true});
  };
  this.getZoomDontShowAgain = function(){
    chrome.storage.local.get("zoomDontShowAgain", function(ret){
      var bZoomDontShowAgain = ret["zoomDontShowAgain"] || false;
      Troff.dontShowZoomInstructions = bZoomDontShowAgain;
    });
  };

  this.getAllSonglists = function(){
    chrome.storage.local.get('straoSongLists', function(ret){
      var straoSongLists = ret['straoSongLists'] || "[]";
      Troff.setSonglists(JSON.parse(straoSongLists));
    });
  };
  
  this.getCurrentSonglist = function(){
    chrome.storage.local.get('iCurrentSonglist', function(ret){
      Troff.setSonglistById(ret['iCurrentSonglist']);
    });
  };
  /* Depricated
  this.getCurrentAreas = function(){
    chrome.storage.local.get('abCurrentAreas', function(ret){
      // Slim sim remove 
      /*
        This following one line is only to ease the transition between 
        v0.5 to v1.0
        It is not used a single time after they open the app with v1.0 
        so the standard is without the ret[] = ret[] || ...
      * /
      ret['abCurrentAreas'] = ret['abCurrentAreas'] || [false,true,false,true,true,true];
      $(ret['abCurrentAreas']).each(function(index, val){
        if(index == 4){
          
        }
        if(val){
          $('#areaSelector').children().eq(index).addClass('active');
          if(index == 4)
            $('#userNoteSection').show();
          if(index == 5)
            $('#infoSection').show();
          else
            $('#areaParent').children().eq(index).show();
        } else {
          $('#areaSelector').children().eq(index).removeClass('active');
          if(index == 4)
            $('#userNoteSection').hide();
          if(index == 5)
            $('#infoSection').hide();
          else
            $('#areaParent').children().eq(index).hide();
        }
      });
    });
  };
  */
  
/*  //depricated OK
  this.getCurrentTab = function(){
    console.error("getCurrentTag ->");
    chrome.storage.local.get('strCurrentTab', function(ret){
      Troff.setTab(ret['strCurrentTab']);
    });
  };
*/
  this.getCurrentSong = function(){
    chrome.storage.local.get('stroCurrentSongPathAndGalleryId', function(ret){
      var stroSong = ret['stroCurrentSongPathAndGalleryId'];
      if(!stroSong){
        // Slim sim remove 
        /*
          This setTimeout is only to ease the transition between v0.3 to v0.4
          it is not used a single time after they open the app with v0.4 
          so the standard is a twoline:
          if(!stroSong) {
            Troff.setAreas([false, true, false, false, false, false]);
            return;
          }
        */
        setTimeout(function(){
          chrome.storage.local.get('stroCurrentSongPathAndGalleryId', function(ret){
            var stroSong = ret['stroCurrentSongPathAndGalleryId'];
            if(!stroSong){
              return;
            }
            var oSong = JSON.parse(stroSong);
            if(oSong.iGalleryId == -1){
              Troff.strCurrentSong = oSong.strPath;
              Troff.iCurrentGalleryId = -1;
            } else {
              setSong(oSong.strPath, oSong.iGalleryId);
            }
          });
        }, 0);
        
        Troff.setAreas([false, true, false, false, false, false]);
//        set areas to false true rest false...

        return;
      }
      var oSong = JSON.parse(stroSong);
      if(oSong.iGalleryId == -1){
        // Slim sim remove 
        /*
          This if is only to ease the transition between v0.3 to v0.4
          it is not used a single time after they open the app with v0.4 
          so the standard is the else, it should NOT be removed!
        */
        Troff.strCurrentSong = oSong.strPath;
        Troff.iCurrentGalleryId = -1;
      } else {
        setSong(oSong.strPath, oSong.iGalleryId);
      }
      
    });
  };


  /* Depricated OK
  this.removeMarker = function(markerId, songId){
    console.error('is this used?"');
    IO.alert("DB.removeMarker is used");


  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song)
      console.error('Error "removeMarker, noSong" occurred, songId=' + songId);
    for(var i=0; i<song.markers.length; i++){
      if(song.markers[i].id == markerId){
        song.markers.splice(i,1);
        break;
      }
    }


    var aFirstAndLast = Troff.getFirstAndLastMarkers();
    var firstMarkerId = aFirstAndLast[0];
    var lastMarkerId = aFirstAndLast[1] + 'S';

    if(markerId == song.currentStartMarker)
      song.currentStartMarker = firstMarkerId;
    if( (markerId+'S') == song.currentStopMarker)
      song.currentStopMarker = lastMarkerId;

    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
  });
  };
  */

  this.updateMarker = function(markerId, newName, newInfo, newColor, newTime, songId){
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song)
      console.error('Error "updateMarker, noSong" occurred, songId=' + songId);
    for(var i=0; i<song.markers.length; i++){
      if(song.markers[i].id == markerId){
        song.markers[i].name = newName;
        song.markers[i].time = newTime;
        song.markers[i].info = newInfo;
        song.markers[i].color = newColor;
        break;
      }
    }

    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
  });
  };// end updateMarker

  this.saveStates = function(songId){
  chrome.storage.local.get(songId, function(ret){
    var aAllStates = Troff.getCurrentStates();
    var aStates = [];
    for(var i=0; i<aAllStates.length; i++){
      aStates[i] = aAllStates.eq(i).attr('strState');
    }
    var song = ret[songId];
    if(!song){
      console.error('Error "saveState, noSong" occurred, songId=' + songId);
      song = {};
      song.markers = [];
    }

    song.aStates = aStates;
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
  });
  };
  
  this.saveZoomTimes = function(songId, startTime, endTime) {
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song){
      console.error('Error "saveZoomTimes, noSong" occurred, songId=' + songId);
      song = DB.getStandardSong();
    }
    
    song.zoomStartTime = startTime;
    song.zoomEndTime = endTime;
    
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
    
    
/*
    var aMarkers = [];
    for(var i=0; i<aAllMarkers.length; i++){
      var oMarker = {};
      oMarker.name  = aAllMarkers[i].value;
      oMarker.time  = aAllMarkers[i].timeValue;
      oMarker.info  = aAllMarkers[i].info;
      oMarker.color = aAllMarkers[i].color;
      oMarker.id    = aAllMarkers[i].id;
      aMarkers[i] = oMarker;
    }
    var song = ret[songId];
    if(!song){
      console.error('Error "saveMarker, noSong" occurred, songId=' + songId);
      song = {};
      song.markers = [];
    }


    song.currentStartMarker = $('.currentMarker')[0].id;
    song.currentStopMarker = $('.currentStopMarker')[0].id;
    song.markers = aMarkers;
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
    */
  });
  };

  this.saveMarkers = function(songId) {
  chrome.storage.local.get(songId, function(ret){
    var aAllMarkers = Troff.getCurrentMarkers();

    var aMarkers = [];
    for(var i=0; i<aAllMarkers.length; i++){
      var oMarker = {};
      oMarker.name  = aAllMarkers[i].value;
      oMarker.time  = aAllMarkers[i].timeValue;
      oMarker.info  = aAllMarkers[i].info;
      oMarker.color = aAllMarkers[i].color;
      oMarker.id    = aAllMarkers[i].id;
      aMarkers[i] = oMarker;
    }
    var song = ret[songId];
    if(!song){
      console.error('Error "saveMarker, noSong" occurred, songId=' + songId);
      song = {};
      song.markers = [];
    }


    song.currentStartMarker = $('.currentMarker')[0].id;
    song.currentStopMarker = $('.currentStopMarker')[0].id;
    song.markers = aMarkers;
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
    
  });
  // use    chrome.storage.sync  ?
  };// end saveMarkers


  // this has nothing to do with "State", it just updates the DB
  // with the songs current data
  this.saveSongDataFromState = function(songId, oState){
  chrome.storage.local.get(songId, function(ret){
          var song = ret[songId];
    if(!song){
        console.error('Error "saveSongDataFromState, noSong" occurred,'+
                        ' songId=' +songId);
        return;
    }
    
    song.volume = oState.volumeBar;
    song.speed = oState.speedBar;
    song.pauseBefStart = [oState.buttPauseBefStart, oState.pauseBeforeStart];
    song.startBefore = [oState.buttStartBefore, oState.startBefore];
    song.stopAfter = [oState.buttStopAfter, oState.stopAfter];
    if($('#'+ oState.currentMarker).length)
      song.currentStartMarker = oState.currentMarker;
    if($('#'+ oState.currentStopMarker).length)
      song.currentStopMarker = oState.currentStopMarker;
    song.wait = [oState.buttWaitBetweenLoops, oState.waitBetweenLoops];
    
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
  });
    
  };
    
  this.setCurrentStartAndStopMarker = function(startMarkerId, stopMarkerId,
                                               songId){
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song){
        console.error('Error "setStartAndStopMarker, noSong" occurred,'+
                        ' songId=' +songId);
        return;
    }
    song.currentStartMarker = startMarkerId;
    song.currentStopMarker = stopMarkerId;
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
  });
  };//end setCurrentStartAndStopMarker



  this.setCurrentStartMarker = function(name, songId){
      DB.setCurrent(songId, 'currentStartMarker', name);
  };
  this.setCurrentStopMarker = function(name, songId){
      DB.setCurrent(songId, 'currentStopMarker', name);
  };
  this.setCurrentPauseBefStart = function(songId, bActive, iPauseBefStart){
      DB.setCurrent(songId, "pauseBefStart", [bActive, iPauseBefStart]);
  };
  this.setCurrentStartBefore = function(songId, bActive, iStartBefore){
      DB.setCurrent(songId, "startBefore", [bActive, iStartBefore]);
  };
  this.setCurrentStopAfter = function(songId, bActive, iStopAfter){
      DB.setCurrent(songId, "stopAfter", [bActive, iStopAfter]);
  };
  this.setCurrentSpeed = function(songId, speed){
      DB.setCurrent(songId, 'speed', speed);
  };
  this.setCurrentVolume = function(songId, volume){
      DB.setCurrent(songId, 'volume', volume);
  };
  /*
  this.setCurrentLoopMode = function(songId, mode){
      if(mode == 'off' || mode == 'times' || mode == 'inf')
          DB.setCurrent(songId, 'loop', mode);
      else
          console.error("Did not recognize the mode: " + mode);
  };
  */
  this.setCurrentSongInfo = function(info, songId){
    DB.setCurrent(songId, 'info', info);
  };
  
  this.setCurrentTempo = function(tempo, songId){
    DB.setCurrent(songId, 'tempo', tempo);
  };

  this.setCurrent = function(songId, key, value){
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song){
        console.error('Error, "noSong" occurred;\n'+
        'songId=' + songId + ', key=' + key + ', value=' + value);
        return;
    }
    song[key] = value;
    var obj = {};
    obj[songId] = song;
    chrome.storage.local.set(obj);
  });
  };//end setCurrent

  this.getMarkers = function(songId, funk) {
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song || !song.markers ){ // new song or no markers
      return;
    }
    funk(song.markers);
  });
  };

  this.getSongMetaDataOf = function(songId) {
    chrome.storage.local.get(songId, function(ret){

      var song = ret[songId];
      
      if(!song || song.zoomEndTime == "max"){ // new song or song needs fixing:
        var maxTime = Number(document.getElementById('timeBar').max);
        song = DB.fixSongObject(song, maxTime);

        var obj1 = {};
        obj1[songId] = song;
        chrome.storage.local.set(obj1);
      }

      
      Troff.selectStartBefore(song.startBefore[0], song.startBefore[1]);
      Troff.selectStopAfter(song.stopAfter[0], song.stopAfter[1]);
      Troff.addMarkers(song.markers);
      Troff.selectMarker(song.currentStartMarker);
      Troff.selectStopMarker(song.currentStopMarker);
      Troff.setMood('pause');
      Troff.selectPauseBefStart(song.pauseBefStart[0], song.pauseBefStart[1] );
      Troff.speed({"data": song.speed});
      Troff.volume({"data": song.volume});
      Troff.setLoopTo(song.loopTimes);
      if(song.bPlayInFullscreen !== undefined)
        Troff.setPlayInFullscreen(song.bPlayInFullscreen);
      Troff.setWaitBetweenLoops(song.wait[0], song.wait[1]);
      
      Troff.setInfo(song.info);
      Troff.setTempo(song.tempo);
      Troff.addButtonsOfStates(song.aStates);
      Troff.setAreas(song.abAreas);
      Troff.zoom(song.zoomStartTime, song.zoomEndTime);

      Troff.setCurrentSong();
      
    });
  }; // end getSongMetadata

};// end DBClass






var IOClass = function(){

  /* this is used to know if button-presses should be in "pop-up"-mode
    or in regular mode */
  var IOEnterFunction = false;

  this.startFunc = function() {
//    IO.setSliderHeight();

    document.addEventListener('keydown', IO.keyboardKeydown);
//    $('#buttSpacePlay').click( Troff.space );
//    $('#buttSpacePause').click( Troff.space );
    $('.buttSpace').click( Troff.space );
    $('#buttTip').click(IO.openHelpWindow);

//    $('#buttAddStartAndEndMarkers').click(Troff.addStartAndEndMarkers);

    $('#timeBar')[0].addEventListener('change', Troff.timeUpdate );
    $('#volumeBar')[0].addEventListener('change', Troff.volumeUpdate );
    $('#speedBar')[0].addEventListener('change', Troff.speedUpdate );

    $('#buttRememberState').click(Troff.rememberCurrentState);
    $('#buttMarker').click(Troff.createMarker);
    $('#okMoveAllMarkersDialogUp').click(Troff.moveAllMarkersUp);
    $('#okMoveAllMarkersDialogDown').click(Troff.moveAllMarkersDown);
    $('#okMoveSomeMarkersDialogUp').click(Troff.moveSomeMarkersUp);
    $('#okMoveSomeMarkersDialogDown').click(Troff.moveSomeMarkersDown);
    $('#buttCancelMoveMarkersDialog').click(Troff.hideMoveMarkers);
    $('#buttPromptMoveMarkers').click(Troff.showMoveMarkers);
    $('#buttPromptMoveMarkersMoreInfo').click(Troff.toggleMoveMarkersMoreInfo);
    $('#buttImportExportMarker').click(Troff.toggleImportExport);
    $('#buttCancelImportExportPopUpSquare').click(Troff.toggleImportExport);
    $('#buttExportMarker').click(Troff.exportStuff);
    $('#buttImportMarker').click(Troff.importStuff);
    $('#buttPauseBefStart').click(Troff.togglePauseBefStart);
    $('#buttStartBefore').click(Troff.toggleStartBefore);
    // Don't update as the user is typing:
    //$('#startBefore').change(Troff.updateStartBefore);
    $('#startBefore')[0].addEventListener('input', Troff.updateStartBefore);
    
    $('#buttZoom').click(Troff.zoomToMarker);
    $('#buttZoomOut').click(Troff.zoomOut);
    
//    $('#songlistsTab').click(Troff.selectSonglistsTab); depricated
//    $('#songsTab').click(Troff.selectSongsTab); depricated
//    $('#statesTab').click(Troff.selectStatesTab); depricated
//    $('#settingsTab').click(Troff.selectSettingsTab); depricated
    $('#areaSelector >').click(Troff.toggleArea);
    
//    $('#songinfoTab').click(Troff.selectSonginfoTab); depricated
//    $('#markerinfoTab').click(Troff.selectMarkerinfoTab); depricated

    $('#markerInfoArea').change(Troff.updateMarkerInfo);
    $('#markerInfoArea').blur(Troff.exitMarkerInfo);
    $('#markerInfoArea').click(Troff.enterMarkerInfo);

    $('#songInfoArea').change(Troff.updateSongInfo);
    $('#songInfoArea').blur(Troff.exitSongInfo);
    $('#songInfoArea').click(Troff.enterSongInfo);
    $('#buttNewSongList').click(Troff.createNewSonglist);
    $('#newSongListName').click(Troff.enterSongListName);
    $('#newSongListName').blur(Troff.exitSongListName);
    $('#saveNewSongList').click(Troff.saveNewSongList);
    $('#removeSongList').click(Troff.removeSonglist);
    $('#cancelSongList').click(Troff.cancelSongList);
    $('#songlistAll').click(Troff.selectAllSongsSonglist);
    
    $('#stopAfter')[0].addEventListener(
      'input', Troff.settAppropriateActivePlayRegion
    );
    $('#buttWaitBetweenLoops').click(Troff.toggleWaitBetweenLoops);
    $('#waitBetweenLoops').change(Troff.setCurrentWaitBetweenLoops);
    $('#buttStopAfter').click(Troff.toggleStopAfter);

    $('#buttUnselectMarkers').click(Troff.unselectMarkers);
    $('#buttResetVolume').click(100, Troff.volume );
    $('#volumeMinus').click(-1, Troff.volume );
    $('#volumePlus').click(1, Troff.volume );
    $('#buttResetSpeed').click(100, Troff.speed );
    $('#speedMinus').click(-1, Troff.speed );
    $('#speedPlus').click(1, Troff.speed );

    $('#pauseBeforeStart').change(Troff.setCurrentPauseBefStart);
    $('#startBefore').change(Troff.setCurrentStartBefore);
    $('#stopAfter').change(Troff.setCurrentStopAfter);

    $('#buttTappTempo').click( Troff.tappTime );


    $('#rateDialogNoThanks').click(Rate.rateDialogNoThanks);
    $('#rateDialogAskLater').click(Rate.rateDialogAskLater);
    $('#rateDialogRateNow').click(Rate.rateDialogRateNow);
    
    $('#firstTimeUserDialogTour').click(Troff.firstTimeUserDialogTour);
    $('#firstTimeUserDialogOK').click(Troff.firstTimeUserDialogOK);
    
    $('#zoomInstructionDialogDontShowAgain').click(Troff.zoomDontShowAgain);
    $('#zoomInstructionDialogOK').click(Troff.zoomDialogOK);
    
    $('#donate').click(function(){
      IO.alert("Waiting for Google Wallet");
      document.getElementById('blur-hack').focus();
    });
    $('.loopButt').click( Troff.setLoop );
    
    
    window.addEventListener('resize', function(){
      Troff.settAppropriateMarkerDistance();
    });

  };//end startFunc

  this.keyboardKeydown  = function(event) {
    if(IOEnterFunction){
      if(event.keyCode == 13){
        IOEnterFunction(event);
      }
      return;
    }

    if(event.keyCode == 229) // wierd thing but ok...
        return;

    //if 0 to 9 or bakspace, del, alt, arrows in a input-field, return,
    //---- site add "numpad"
    if(
        $(':input[type="number"]' ).is(":focus") 
        &&
        (
          (event.keyCode>=48 && event.keyCode<=57) || //numbers
          (event.keyCode>=96 && event.keyCode<=105)|| //numpad
          event.keyCode==8  || //backspace
          event.keyCode==18 || //alt
          event.keyCode==37 || //left arrow
          event.keyCode==39 || //right arrow
          event.keyCode==46    //del
        )
      ){
      return;
    }
    document.getElementById('blur-hack').focus();


    if(event.keyCode>=48 && event.keyCode<=57) {
        // pressed a number
        var number = event.keyCode - 48;
        Troff.setLoopTo(number);
    }
    
    var altTime = 0.08333333333; // one frame
    var regularTime = 0.8333333333; // 10 freames
    var shiftTime = 8.333333333; // 100 frames

    switch(event.keyCode){
    case 32: //space bar
      Troff.space();
      break;
    case 13: // return
      Troff.enterKnappen();
      break;
    case 27: // esc
      Troff.pauseSong();
      Troff.forceNoFullscreen();
      break;
    case 77: // M
      Troff.createMarker();
      break;
    case 78: // N
      if(event.shiftKey==1){
        Troff.selectNext(/*reverse = */true);
      } else {
        Troff.selectNext(/*reverse = */ false);
      }
      break;
    case 82: //R (remember Setting)
      Troff.rememberCurrentState();
      break;
    case 40: // downArrow
      if(event.shiftKey==1 && event.altKey==1)
        Troff.moveOneMarkerDown(shiftTime);
      else if(event.shiftKey==1)
        Troff.moveOneMarkerDown(regularTime);
      else if(event.altKey)
        Troff.moveOneMarkerDown(altTime);
      break;
    case 38: // uppArrow ?
      if(event.shiftKey==1 && event.altKey==1)
        Troff.moveOneMarkerDown(-shiftTime);
      else if(event.shiftKey==1)
        Troff.moveOneMarkerDown(-regularTime);
      else if(event.altKey)
        Troff.moveOneMarkerDown(-altTime);
      break;
    case 39: // rightArrow
      if(event.shiftKey==1)
      $('audio, video')[0].currentTime += shiftTime;
      else if(event.altKey==1)
      $('audio, video')[0].currentTime += altTime;
      else
        $('audio, video')[0].currentTime += regularTime;
      break;
    case 37: // leftArrow
      if(event.shiftKey==1)
      $('audio, video')[0].currentTime -= shiftTime;
      else if(event.altKey==1)
      $('audio, video')[0].currentTime -= altTime;
      else
        $('audio, video')[0].currentTime -= regularTime;
      break;
    case 80: // P
      if(event.shiftKey==1)
        Troff.incrementInput('#pauseBeforeStart', 1, Troff.updateSecondsLeft);
      else if(event.altKey==1)
        Troff.incrementInput('#pauseBeforeStart',-1, Troff.updateSecondsLeft);
      else
        Troff.togglePauseBefStart();
      break;
    case 66: // B
      if(event.shiftKey==1)
        Troff.incrementInput('#startBefore', 1, Troff.updateStartBefore);
      else if(event.altKey==1)
        Troff.incrementInput('#startBefore',-1, Troff.updateStartBefore);
      else
        Troff.toggleStartBefore();
      break;
    case 65: // A
      if(event.shiftKey==1)
        Troff.incrementInput('#stopAfter', 1, 
                             Troff.settAppropriateActivePlayRegion);
      else if(event.altKey==1)
        Troff.incrementInput('#stopAfter',-1, 
                             Troff.settAppropriateActivePlayRegion);
      else
        Troff.toggleStopAfter();
      break;
    case 83: // S
      if(event.shiftKey==1)
        Troff.speed({"data": 1});
      else if(event.altKey==1)
        Troff.speed({"data": -1});
      else
        Troff.speed({"data": 100});
      break;
    case 84: // T
      Troff.tappTime();
      break;
    case 69: // E
      Troff.editCurrentMarkerInfo();
      break;
    case 70: // F
      Troff.forceFullscreenChange();
      break;
    case 85: // U
      if(event.shiftKey==1)
        Troff.unselectStartMarker();
      else if(event.altKey==1)
        Troff.unselectStopMarker();
      else
        Troff.unselectMarkers();
      break;
    case 86: // V
      if(event.shiftKey==1)
        Troff.volume({"data": 1});
      else if(event.altKey==1)
        Troff.volume({"data": -1});
      else
        Troff.volume({"data": 100});
      break;
    case 87: // W
      if(event.shiftKey==1)
        Troff.incrementInput('#waitBetweenLoops', 1);
      else if(event.altKey==1)
        Troff.incrementInput('#waitBetweenLoops', -1);
      else
        Troff.toggleWaitBetweenLoops();
      break;
    case 90: // Z
      if(event.shiftKey==1)
        Troff.zoomOut();
      else
        Troff.zoomToMarker();
      break;
    default:
      //console.info("key " + event.keyCode);
      //nothing
    }// end switch

  }; // end keyboardKeydown *****************/

  this.setEnterFunction = function(func){
    IOEnterFunction = func;
  };
  
  this.clearEnterFunction = function(){
    IOEnterFunction = false;
  };

  this.promptEditMarker = function(markerId, func, funcCancle){
    var markerName;
    var markerInfo;
    var markerColor;
    var markerTime;
    var strHeader;

    if(markerId){
      markerName = $('#'+markerId).val();
      markerInfo = $('#'+markerId)[0].info;
      markerColor = $('#'+markerId)[0].color;
      markerTime = Number($('#'+markerId)[0].timeValue);
      strHeader = "Edit marker";
    } else {
      markerName = "marker nr " + ($('#markerList li').length + 1);
      markerInfo = "";
      markerColor = "None";
      markerTime = $('audio, video')[0].currentTime;
      strHeader = "Create new marker";
    }


    var time = Date.now();

    var textId = "textId" + time;
    var markerNameId = "markerNameId" + time;
    var markerTimeId = "markerTimeId" + time;
    var markerInfoId = "markerInfoId" + time;
    var markerColorId = "markerColorId" + time;
    var outerId = "outerId" + time;
    var innerId = "innerId" + time;
    var outerDivStyle = ""+
      "position: fixed; "+
      "top: 0px;left: 0px; "+
      "width: 100vw; "+
      "height: 100vh; "+
      "background-color: "+
      "rgba(0, 0, 0, 0.5);"+
      "display: flex;align-items: center;justify-content: center;";
    var innerDivStyle = ""+
      "width: 200px;"+
      "padding: 10 15px;"+
      "font-size: 18px;"+
      "display: flex;"+
      "flex-direction: column;";


    IOEnterFunction = function(){
      if(func) func( 
        $("#"+markerNameId).val(), 
        $("#"+markerInfoId).val(),
        $(".colorPickerSelected").attr("color"),
        $("#"+markerTimeId).val()
      );
      $('#'+outerId).remove();
      IOEnterFunction = false;
    };

    
    var buttOK = $("<input>", {
      "type":"button",
      "class":"regularButton",
      "value": "OK"
    }).click(IOEnterFunction);

    var buttCancel = $("<input>", {
      "type":"button",
      "class": "regularButton",
      "value": "Cancel"
    }).click(function(){
      if(funcCancle) funcCancle();
      $('#'+outerId).remove();
      IOEnterFunction = false;
    });

    var buttRemove = $("<input>", {
      "type":"button",
      "class":"regularButton",
      "value": "Remove"
    }).click(function(){
      $('#'+outerId).remove();
      IOEnterFunction = false;

      if( $('#markerList li').length <= 2 ) {
        IO.alert(
          "Minimum number of markers",
          "You can not remove this marker at the moment, "+
          "you can not have fewer than 2 markers"
        );
        return;
      }

      if(markerId){
        IO.confirm("Remove marker", "Are you sure?", function(){
          Troff.removeMarker(markerId);
        });
      }
    });
    
    function setColor(){
      $('.colorPickerSelected').removeClass('colorPickerSelected');
      this.classList.add('colorPickerSelected');
      $("#"+markerColorId).html(this.getAttribute('color'));
      document.getElementById('blur-hack').focus();
    }
    function generateColorBut(col){
      var clas = "colorPicker";
      if(col === markerColor){
        clas += " colorPickerSelected";
      }
      return $("<input>", {
                "type":"button",
                "value":"",
                "color":col,
                "class":clas,
                "style":"background: " + col
              }).click(setColor);
    }
    var butColor0 = generateColorBut("None");
    
    var butColor1 = generateColorBut("Bisque");
    var butColor2 = generateColorBut("Aqua");
    var butColor3 = generateColorBut("Chartreuse");
    var butColor4 = generateColorBut("Coral");
    var butColor5 = generateColorBut("Pink");
    
    var butColor6 = generateColorBut("Burlywood");
    var butColor7 = generateColorBut("Darkcyan");
    var butColor8 = generateColorBut("Yellowgreen");
    var butColor9 = generateColorBut("Peru");
    var butColor10 = generateColorBut("Violet");


    var row0 = $("<span>", {"class": "oneRow"})
               .append($("<h2>", {"id": "p1"}).append(strHeader));


    var row1 = $("<span>", {"class": "oneRow"})
               .append($("<p>", {"id": "p1"}).append("Name:"))
               .append($("<input>", {
                   "id": markerNameId,
                   "type":"text",
                   "value": markerName,
                   "style":"margin-left:7px; width:100%; "
                   })
               );


    var row2 = $("<span>", {"class": "oneRow"})
                  .append($("<p>").append("Time:"))
                  .append($("<input>", {
                      "id": markerTimeId,
                      "type":"number",
                      "value":markerTime,
                      "style":"width: 84px; text-align: left; "+
                            "margin-left:8px; padding: 4px;"
                  }))
                  .append($("<p>").append("seconds"));

    var row3 = $("<span>", {"class": "oneRow"})
                    .append($("<p>").append("Info:"))
                    .append($("<textarea>", {
                        "id": markerInfoId,
                        "placeholder":"Put extra marker info here",
                        "text": markerInfo,
                        "rows": 6,
                        "style":"margin-left:13px; padding: 4px; width:100%;"
                    }));
                    
    var row4 = $("<span>", {"class": "oneRow"})
                  .append(
                    $("<div>", {"class": "flexCol flex"})
                    .append($("<p>").append("Color:"))
                    .append($("<p>", {"id":markerColorId}).append("red"))
                  ) 
                  .append(
                    $("<div>", {"class":"flexRowWrap"})
                    .append(butColor0)
                  )
                  .append(
                    $("<div>", {"class":"flexRowWrap colorPickerWidth"})
                    .append(butColor1)
                    .append(butColor2)
                    .append(butColor3)
                    .append(butColor4)
                    .append(butColor5)
                    .append(butColor6)
                    .append(butColor7)
                    .append(butColor8)
                    .append(butColor9)
                    .append(butColor10)
                  );

    var row5 = "";
    if(markerId){
      row5 = $("<span>", {"class": "oneRow"})
                      .append($("<p>").append("Remove this marker:"))
                      .append(buttRemove);
    }
    var row6 = $("<span>", {"class": "oneRow"})
                    .append(buttOK)
                    .append(buttCancel);

    $('body')
      .append(
        $("<div>", {"id": outerId, "style": outerDivStyle})
          .append(
            $("<div>", {"id": innerId,"style": innerDivStyle})
              .addClass('secondaryColor')
              .append(row0)
              .append(row1)
              .append(row2)
              .append(row3)
              .append(row4)
              .append(row5)
              .append(row6)
          )// end inner div
      );// end outer div

    var quickTimeOut = setTimeout(function(){
      $("#"+markerNameId).select();
      $("#"+markerColorId).html(markerColor);
      clearInterval(quickTimeOut);
    }, 0);

  }; // end promptEditMarker   *******************/

  this.promptDouble = function(oInput, func, funcCancle){
    var textHead = oInput.strHead;
    var textBox  = oInput.strInput;
    var bDouble  = oInput.bDouble;
    var strTextarea = oInput.strTextarea || "";
    var strTextareaPlaceholder = oInput.strTextareaPlaceholder || "";
    
    var time = Date.now();
    var buttEnterId = "buttOkId" + time;

    var textId = "textId" + time;
    var textareaId = "textareaId" + time;
    var buttCancelId = "buttCancelId" + time;
    var innerId = "innerId" + time;
    var outerId = "outerId" + time;
    var outerDivStyle = ""+
        "position: fixed; "+
        "top: 0px;left: 0px; "+
        "width: 100vw; "+
        "height: 100vh; "+
        "background-color: rgba(0, 0, 0, 0.5);"+
        "z-index: 99;"+
        "display: flex;align-items: center;justify-content: center;";
    var innerDivStyle = ""+
        "width: 200px;"+
        "padding: 10 15px;";
    var pStyle = "" +
        "font-size: 18px;";

    var strTextareaHTML ="";
    if(bDouble){
      strTextareaHTML = "<textarea placeholder='"+strTextareaPlaceholder+"'"+
                    "id='"+textareaId+"'>"+strTextarea+"</textarea>";
    } 

    $("body").append($("<div id='"+outerId+"' style='"+outerDivStyle+
               "'><div id='"+innerId+"' style='"+innerDivStyle+
               "' class='secondaryColor'><p style='"+pStyle+"'>" + textHead +
               "</p><input type='text' id='"+textId+
               "'/> "+strTextareaHTML+
               "<input type='button' class='regularButton' id='"+ buttEnterId +
               "' value='OK'/><input type='button' class='regularButton' id='"
               + buttCancelId + "' value='Cancel'/></div></div>"));

    $("#"+textId).val(textBox);
    var quickTimeOut = setTimeout(function(){
        $("#"+textId).select();
        clearInterval(quickTimeOut);
    }, 0);

    IOEnterFunction = function(){
        if(func) func( $("#"+textId).val(), $("#"+textareaId).val() );
        $('#'+outerId).remove();
        IOEnterFunction = false;
    };
    $("#"+buttEnterId).click( IOEnterFunction );
    $("#"+buttCancelId).click( function(){
        if(funcCancle) funcCancle();
        $('#'+outerId).remove();
        IOEnterFunction = false;
    });
  }; // end promptDouble

  this.prompt = function(textHead, textBox, func, funcCancle){
    var oFI = {};
    oFI.strHead = textHead;
    oFI.strInput = textBox;
    oFI.bDouble = false;
    oFI.strTextarea = "";
    oFI.strTextareaPlaceholder = "";
    IO.promptDouble(oFI, func, funcCancle);
  }; // end prompt

  this.confirm = function(textHead, textBox, func, funcCancle){
      var time = Date.now();
      var buttEnterId = "buttOkId" + time;

      var textId = "textId" + time;
      var buttCancelId = "buttCancelId" + time;
      var innerId = "innerId" + time;
      var outerId = "outerId" + time;
      var outerDivStyle = ""+
          "position: fixed; "+
          "top: 0px;left: 0px; "+
          "width: 100vw; "+
          "height: 100vh; "+
          "background-color: rgba(0, 0, 0, 0.5);"+
          "z-index: 99;"+
          "display: flex;align-items: center;justify-content: center;";
      var innerDivStyle = ""+
          "width: 200px;"+
          "padding: 10 15px;";
      var pStyle = "" +
          "margin: 6px 0;";

      $("body").append($("<div id='"+outerId+"' style='"+outerDivStyle+
                 "'><div id='"+innerId+"' style='"+innerDivStyle+
                 "' class='secondaryColor'><h2>" + textHead +
                 "</h2><p style='"+pStyle+"'>" + textBox +
                 "</p><div><input type='button' class='regularButton' id='"
                 + buttEnterId +
                 "' value='OK'/><input type='button' class='regularButton' id='"
                 +buttCancelId + "' value='Cancel'/></div></div></div>"));

      IOEnterFunction = function(){
          if(func) func();
          $('#'+outerId).remove();
          IOEnterFunction = false;
      };
      $("#"+buttEnterId).click( IOEnterFunction );
      $("#"+buttCancelId).click( function(){
          if(funcCancle) funcCancle();
          $('#'+outerId).remove();
          IOEnterFunction = false;
      });
  }; // end confirm


  this.alert = function(textHead, textBox, func){
      var time = Date.now();
      var buttEnterId = "buttOkId" + time;

      var textId = "textId" + time;
      var innerId = "innerId" + time;
      var outerId = "outerId" + time;
      var outerDivStyle = ""+
          "position: fixed; "+
          "top: 0px;left: 0px; "+
          "width: 100vw; "+
          "height: 100vh; "+
          "background-color: rgba(0, 0, 0, 0.5);"+
          "z-index: 99;"+
          "display: flex;align-items: center;justify-content: center;";
      var innerDivStyle = ""+
          "width: 200px;"+
          "padding: 10 15px;";
      var hStyle = "" +
          "font-size: 18px;";
      var pStyle = "" +
          "font-size: 14px;";

      if(textBox){
          $("body").append($("<div id='"+outerId+"' class='outerDialog'>"+
            "<div id='"+innerId+"' style='"+innerDivStyle+
                     "' class='secondaryColor'><h2 style='"+hStyle+"'>" + textHead +
                     "</h2><p style='"+pStyle+"' type='text' id='"+textId+
                     "'>"+textBox+"</p> <input type='button' id='"+buttEnterId+
                     "'class='regularButton' value='OK'/></div></div>"));
          $("#"+textId).val(textBox).select();
      } else {
          $("body").append($("<div id='"+outerId+"' class='outerDialog'>"+
            "<div id='"+innerId+"' style='"+innerDivStyle+
                  "' class='secondaryColor'><p style='"+pStyle+"'>" + textHead +
                  "</p><input type='button' id='"+buttEnterId+
                  "' class='regularButton' value='OK'/></div></div>"));
      }
      IOEnterFunction = function(){
          if(func) func( $("#"+textId).val() );
          $('#'+outerId).remove();
          IOEnterFunction = false;
      };
      $("#"+buttEnterId).click( IOEnterFunction );
  }; // end alert

  this.pressEnter = function() {
    if(IOEnterFunction) IOEnterFunction();
  };

  this.openHelpWindow = function() {
//    chrome.app.window.create('help.html');
    
    chrome.app.window.create(
      'help.html',
      {bounds: {width:742, height:600}, minWidth:300, minHeight:200,  id:"HelpWin"}
    );
    document.getElementById('blur-hack').focus();
  };

/* Depricated OK
  this.setSliderHeight = function() {
//    var iHeight = IO.calcRestHeightFrom(
//      '#div_to_calc_height_of_timeSection, #buttResetVolume, #plussMinusButtons, #volumeDataOutput');
      return;
      var css = '#div_to_calc_height_of_timeSection,'
        + '#buttResetVolume,'
        + '#plussMinusButtons,'
        + '#volumeDataOutput'
        + '#donate';

    var totalHeight = 0;
    $(css).each(function(){
      totalHeight += $(this).outerHeight();});
      "totalHeight", totalHeight);
    iHeight = $('#timeSection').innerHeight() - totalHeight;
    

    var sliderHeight = Math.max(iHeight, 40);
    $('#volumeBar, #speedBar').height(sliderHeight);
  };
*/
/* depricated OK
  this.calcRestHeightFrom = function(cssToCalcFrom){
    var w = window;
    var d = document;
    var e = d.documentElement;
    var g = d.getElementsByTagName('body')[0];
    //var winWidth = w.innerWidth || e.clientWidth || g.clientWidth,
    var winHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;
    winHeight = winHeight * 0.98;

    var totalHeight = 0;
    $(cssToCalcFrom).each(function(){
        totalHeight += $(this).outerHeight();
    });

    return winHeight - totalHeight - 4;
  };
*/
  this.loopTimesLeft = function(input){
    if(!input)
        return $('.loopTimesLeft').eq(0).text();
    if(input == -1)
        $('.loopTimesLeft').html( $('.loopTimesLeft').eq(0).text() -1 );
    else
        $('.loopTimesLeft').html( input );
  };

}; // end IOClass

var Troff = new TroffClass();
var DB = new DBClass();
var IO = new IOClass();
var Rate = new RateClass();

$(document).ready( function() {
  
  DB.cleanDB();
  DB.getAllSonglists();
  DB.getZoomDontShowAgain();
//  DB.getCurrentTab(); // depricated OK
  IO.startFunc();
  //FS.startFunc();
  FSstartFunc();
  Rate.startFunc();
  DB.getCurrentSong();
  
//  DB.getCurrentAreas(); //depricated

});
