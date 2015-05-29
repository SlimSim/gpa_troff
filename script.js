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

  var margin = "4px";
  video.style.marginTop = margin;
  video.style.marginBottom = margin;
  fsButton.style.marginTop = margin;

  fsButton.addEventListener('click', Troff.playInFullscreenChanged);

  fsButton.appendChild( document.createTextNode('Play in Fullscreen') );
  fsButton.setAttribute('id', "playInFullscreenButt");
  videoBox.setAttribute('id', "videoBox");

  video.addEventListener('loadedmetadata', function(e){
    Troff.setMetadata(video);
  });

  content_div.appendChild(fsButton);
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
            console.info("I'm in the if, so no metadata...");
            newElem.setAttribute('src', fileEntry.toURL());
          } else {
            fileEntry.file(function(file) {
              chrome.mediaGalleries.getMetadata(file, {}, function(metadata) {
                if(metadata.title){
                  $('#currentSong').text( metadata.title).show();
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
  optGrp.appendChild(document.createTextNode(name));
  optGrp.setAttribute("id", id);
  checkbox.setAttribute("type", "checkbox");
  label.setAttribute("class", "flexrow");
  label.appendChild(checkbox);
  label.appendChild(optGrp);
  li.appendChild(label);
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
    li.appendChild(label);
    document.getElementById("newSongListPartAllSongs").appendChild(li);
    // Slim sim remove 
    /*
      This if is only to ease the transition between v0.3 to v0.4
      it is not used a single time after they open the app with v0.4 
    */
    if(Troff.iCurrentGalleryId == -1 && itemEntry.fullPath == Troff.strCurrentSong )
      setSong(itemEntry.fullPath, mData.galleryId);
  } else {
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
      'pleas add a directory with a song or video in it.'
    );
  }

}

function FSstartFunk(){
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
    var startTime = 0;
    var previousTime = 0;
    var time = 0;
    var nrTapps = 0;

  this.setPlayInFullscreen = function(bPlayInFullscreen){
    var butt = document.querySelector('#playInFullscreenButt');
    butt.classList.toggle("active", bPlayInFullscreen);

  };

  this.playInFullscreenChanged = function(){

    var butt = document.querySelector('#playInFullscreenButt');
    butt.classList.toggle("active");

    var bFullScreen = butt.classList.contains('active');
    DB.setCurrent(strCurrentSong, 'bPlayInFullscreen', bFullScreen );

    document.getElementById('blur-hack').focus();

  };

  /* this funciton is called when the full song/video is loaded,
   * it should thus do the things that conect player to Troff...
   */
  this.setMetadata = function(media){
    var songLength = media.duration;
    document.getElementById('timeBar').max = media.duration;
    $('#maxTime')[0].innerHTML = Troff.secToDisp(media.duration);

    // add Start and End marker to html
//    Troff.addMarkers([{"Start":0},{"End":songLength}]);

    DB.getSongMetaDataOf(Troff.getCurrentSong());
    media.addEventListener("timeupdate", Troff.timeupdateAudio );
  };

  this.getStandardMarkerInfo = function(){
    return "This text is specific for every selected marker. "
      +"Notes written here will be saved untill next time."
      +"\n\nUse this area for things regarding this marker.";
  };

  this.setWaitBetweenLoops = function(wait){
    $('#waitBetweenLoops').val(wait);
  };
  this.setCurrentWaitBetweenLoops = function(){
    var wait = $('#waitBetweenLoops').val();
    DB.setCurrent(strCurrentSong, 'wait', wait);
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
        Troff.playSong( $('#waitBetweenLoops').val()*1000 );
      } else {
        if ( IO.loopTimesLeft()>1 ){
          IO.loopTimesLeft( -1 );
          Troff.playSong( $('#waitBetweenLoops').val()*1000 );
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

  // goToStartMarker används när man updaterar startBefore / trycker på StartBefore  / trycker på en marker???
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
    $('#secondsLeft').html(secondsLeft);

    if(Troff.stopTimeout) clearInterval(Troff.stopTimeout);
    Troff.setMood('wait');
    Troff.stopTimeout = setTimeout(function(){
        if(Troff.getMood() == 'pause' ) return;
        audio.play();
        Troff.setMood('play');
        $('#buttSpacePause').css('display', 'block');
        $('#buttSpacePlay').css('display', 'none');
    }, wait);

    // stopInterval is the counter
    if(Troff.stopInterval) clearInterval(Troff.stopInterval);
    Troff.stopInterval = setInterval(function() {
        if(Troff.getMood() == 'wait' ){ //audio.isPaused) {
        secondsLeft -= 1;
        if(secondsLeft <= 0 ){
            $('#secondsLeft').html(0);
            clearInterval(Troff.stopInterval);
        } else {
            $('#secondsLeft').html(secondsLeft);
        }
        }  else {
        clearInterval(Troff.stopInterval);
        $('#secondsLeft').html( 0 );
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

    $('#buttSpacePlay').css('display', 'block');
    $('#buttSpacePause').css('display', 'none');
  };

  this.updateSecondsLeft = function(){
    if(Troff.getMood() == 'pause'){
        if ($('#buttPauseBefStart').hasClass('active'))
        $('#secondsLeft').html( $('#pauseBeforeStart').val() );
        else
        $('#secondsLeft').html( 0 );
    }
  };

  this.setMood = function( mood ){
    if(mood == 'pause'){
      $('#infoSection').removeClass('play');
      $('#infoSection').removeClass('wait');
      $('#infoSection').addClass('pause');
      Troff.updateSecondsLeft();

      if(document.querySelector('#playInFullscreenButt.active')){
        document.querySelector('#videoBox').classList.remove('fullscreen');
        document.querySelector('#infoSection').classList.remove('overFilm');
      }


      // site: flytta in #buttSpacePlay').css - att ändra play-markören till paus och tillbax hit?
      // sitället för att ha det utspritt i koden???

    }
    if(mood == 'wait'){
      $('#infoSection').removeClass('play');
      $('#infoSection').removeClass('pause');
      $('#infoSection').addClass('wait');


      if(document.querySelector('#playInFullscreenButt.active')){
        document.querySelector('#videoBox').classList.add('fullscreen');
        document.querySelector('#infoSection').classList.add('overFilm');
      }

      $('#buttSpacePlay').css('display', 'none');
      $('#buttSpacePause').css('display', 'block');
    }
    if(mood == 'play'){
      $('#infoSection').removeClass('wait');
      $('#infoSection').removeClass('pause');
      $('#infoSection').addClass('play');


      if(document.querySelector('#playInFullscreenButt.active')){
        document.querySelector('#videoBox').classList.add('fullscreen');
        document.querySelector('#infoSection').classList.remove('overFilm');
      }

    }
  };

  this.getCurrentSong = function() {
    return strCurrentSong;
  };

  this.setWaitForLoad = function(path, iGalleryId){
    if(strCurrentSong){
        Troff.pauseSong();
        Troff.clearAllMarkers();
        Troff.setTempo('?');
        Troff.setWaitBetweenLoops(1);
    }
    strCurrentSong = path;
    iCurrentGalleryId = iGalleryId;

    $('#currentArtist').text("Wait for song to load");
    $('#infoSection, #currentSong, #currentAlbum').hide();
  };

  this.setCurrentSong = function(){
    DB.setCurrentSong(strCurrentSong, iCurrentGalleryId);
    $('#infoSection').show();
  }; // end SetCurrentSong

  this.pathToName = function(filepath){
    // ska jag ha 1 eller filepath.lastIndexOf('/') ???
    return filepath.substr(1,filepath.lastIndexOf('.') - 1);
  };

  this.getCurrentMarkers = function(bGetStopMarkers){
    if(bGetStopMarkers){
      return $('#markerList li input:nth-child(4)');
    }
    return $('#markerList li input:nth-child(3)');
  };

  /*
    exportMarker, gets current song markers to the clippboard
  */
  this.exportMarker = function(){
    IO.pressEnter();
    DB.getMarkers( strCurrentSong, function(aoMarkers){
      
      var aoTmpMarkers = [];
      for (var i=0; i<aoMarkers.length; i++){
        var oTmp = {};
        oTmp.name = aoMarkers[i].name;
        oTmp.time = aoMarkers[i].time;
        oTmp.info = aoMarkers[i].info;
        oTmp.color = aoMarkers[i].color;
        aoTmpMarkers[i] = oTmp;
      }
      var sMarkers = JSON.stringify(aoTmpMarkers);
      
      IO.prompt("Copy the marked text to export your markers", sMarkers);
    });
  }; // end exportMarker

  /*
    importMarker, promps for a string with markers
  */
  this.importMarker = function(){
    IO.pressEnter();
    IO.prompt("Please paste the text you recieved to import the markers",
              "Paste text here",
              function(sMarkers){
      var aMarkers = JSON.parse(sMarkers);

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

    });
  };

  /*
    createMarker, all, tar reda på tiden o namnet,
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
  
  this.selectSonglistsTab = function(){
    DB.setCurrentTab('songlists', Troff.getCurrentSong());
    $('#songlistsArea').show();
    $('#gallery').hide();
    $('#markerInfoArea').hide();
    $('#songInfoArea').hide();
    $('#songlistsTab').addClass('selected');
    $('#songsTab').removeClass('selected');
    $('#songinfoTab').removeClass('selected');
    $('#markerinfoTab').removeClass('selected');
    document.getElementById('blur-hack').focus();
  };
  
  this.selectSongsTab = function(){
    DB.setCurrentTab('songs', Troff.getCurrentSong());
    $('#songlistsArea').hide();
    $('#gallery').show();
    $('#markerInfoArea').hide();
    $('#songInfoArea').hide();
    $('#songlistsTab').removeClass('selected');
    $('#songsTab').addClass('selected');
    $('#songinfoTab').removeClass('selected');
    $('#markerinfoTab').removeClass('selected');
    document.getElementById('blur-hack').focus();
  };
  this.selectSonginfoTab = function(){
    DB.setCurrentTab('songinfo', Troff.getCurrentSong());
    $('#songlistsArea').hide();
    $('#gallery').hide();
    $('#songInfoArea').show();
    $('#markerInfoArea').hide();
    $('#songlistsTab').removeClass('selected');
    $('#songsTab').removeClass('selected');
    $('#songinfoTab').addClass('selected');
    $('#markerinfoTab').removeClass('selected');
    document.getElementById('blur-hack').focus();
  };
  this.selectMarkerinfoTab = function(){
    DB.setCurrentTab('markerinfo', Troff.getCurrentSong());
    $('#songlistsArea').hide();
    $('#gallery').hide();
    $('#songInfoArea').hide();
    $('#markerInfoArea').show();
    $('#songlistsTab').removeClass('selected');
    $('#songinfoTab').removeClass('selected');
    $('#songsTab').removeClass('selected');
    $('#markerinfoTab').addClass('selected');
    document.getElementById('blur-hack').focus();
  };
  
  this.setInfo = function(info){
    $('#songInfoArea').val(info);
  };
  this.setTab = function(tab){
    /**/ if(tab === "songinfo") Troff.selectSonginfoTab();
    else if(tab === "markerinfo") Troff.selectMarkerinfoTab();
    else if(tab === "songs") Troff.selectSongsTab();
    else if(tab === "songlists") Troff.selectSonglistsTab();
    else /* catch all... */ Troff.selectSongsTab();

  };
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
    $('#songListPart').hide();
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
    $('#songListPart').hide();
    $('#removeSongList').hide();
    $('#newSongListName').focus();
    $('#newSongListName').click();
  };
  
  this.cancelSongList = function(){
    document.getElementById('blur-hack').focus();
    $('#newSongListPart').hide();
    $('#songListPart').show();
    Troff.resetNewSongListPartAllSongs();
  };
  
  this.removeSonglist = function(){
    IO.confirm( 'Remove songlist?',
                'Don you want to permanently remove this songlist?',
                function(){
      $('#newSongListPart').hide();
      $('#songListPart').show();
      document.getElementById('blur-hack').focus();
      var iSonglistId = parseInt($('#newSongListName').attr('iSonglistId'));
      
      var aSonglists = $('#songListPartTheLists li');
      for(var j=0; j<aSonglists.length; j++){
        var oCurrSonglist = JSON.parse(aSonglists.eq(j).attr('stroSonglist'));
        if(oCurrSonglist.id === iSonglistId){
          aSonglists.eq(j).remove();
          break;
        }
      }
      
      DB.saveSonglists(); // this saves the current songlists from html to DB
      Troff.resetNewSongListPartAllSongs();

    });
  };
  
  this.saveNewSongList = function(){
    $('#newSongListPart').hide();
    $('#songListPart').show();
    
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
        if(dfullpath !== null && dfsid !== null){
          aSonglist.push({'fullPath':dfullpath, 'galleryId':dfsid});
        }
        else{
          aSonglist.push({'header':aRows.eq(i).children(0).children(1).text()});
        }
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
      .addClass('removeButt')
      .click(Troff.editSonglist);

    var buttL = $('<input>')
      .val(oSonglist.name)
      .attr('type', 'button')
      .click(Troff.selectSonglist);

    var li = $('<li>')
      .attr('stroSonglist', JSON.stringify(oSonglist))
      .append(buttE)
      .append(buttL);

    $('#songListPartTheLists').append(li);

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
  
  this.selectAllSongsSonglist = function(){
    document.getElementById('blur-hack').focus();
    $('#songListPartTheLists li input').removeClass('selected');
    $('#songlistAll').addClass('selected');
    $('#gallery').empty();
    
    
    DB.setCurrentSonglist(0);

    var aSongs = $('#newSongListPartAllSongs').children();
    for(var i=0; i<aSongs.length; i++){
      var songElement = $('#newSongListPartAllSongs').children().eq(i);
      var fullPath = songElement.attr('fullPath');
      var galleryId = songElement.attr('galleryId');
      if (fullPath === undefined) { 
        var head = document.createElement("h3");
        head.appendChild(document.createTextNode( songElement.text() ));
        document.getElementById("gallery").appendChild(head);
        continue;
      }
      var pap = Troff.getMediaButton(fullPath, galleryId);
      document.getElementById("gallery").appendChild(pap);
    }
  };
  
  this.selectSonglist = function(event){
    document.getElementById('blur-hack').focus();
    $('#songListPartTheLists li input, #songlistAll').removeClass('selected');
    this.classList.add('selected');
    var li = this.parentNode;
    var stroSonglist = li.getAttribute('stroSonglist');
    var oSonglist = JSON.parse(stroSonglist);

    DB.setCurrentSonglist(oSonglist.id);
    $('#gallery').empty();
    
    var aSongs = oSonglist.songs;
    for(var i=0; i<aSongs.length; i++){
      if(aSongs[i].header !== undefined){
        var header =  document.createElement("h3");
        header.appendChild(document.createTextNode(aSongs[i].header));
        document.getElementById("gallery").appendChild(header);
        continue;
      }
      if(!checkIfSongExists(aSongs[i].fullPath, aSongs[i].galleryId)) 
        continue;
      var pap = Troff.getMediaButton(aSongs[i].fullPath, aSongs[i].galleryId);
      document.getElementById("gallery").appendChild(pap);
    }
  };

  this.getMediaButton = function(fullPath, galleryId){
    var pap = document.createElement("button");
    pap.setAttribute("class", "mediaButton");
    if(fullPath == Troff.getCurrentSong())
      pap.classList.add('selected');
    pap.appendChild(document.createTextNode(Troff.pathToName(fullPath)));
    pap.setAttribute("fullPath", fullPath );
    pap.setAttribute("galleryId", galleryId );
    pap.addEventListener('click', Troff.selectSong );
    return pap;
  };
  
  this.editCurrentInfo = function(){
    var infoAreaId = "";
    if($('#songinfoTab').hasClass('selected'))
      infoAreaId = 'songInfoArea';
    if($('#markerinfoTab').hasClass('selected'))
      infoAreaId = 'markerInfoArea';
    var quickTimeOut = setTimeout(function(){
      document.getElementById(infoAreaId).click();
      document.getElementById(infoAreaId).focus();
      clearInterval(quickTimeOut);
    }, 0);
  };
  
  this.focusSongInfoArea = function(){
    $('#songinfoTab').click();
  };
    
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
    document.getElementById('blur-hack').focus();
  };

    this.updateSongInfo = function(){
      var strInfo = $('#songInfoArea')[0].value;
      var songId = Troff.getCurrentSong();
      DB.setCurrentSongInfo(strInfo, songId);
    };
    
    
    
  this.focusMarkerInfoArea = function(){
    $('#markerinfoTab').click();
  };
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
    document.getElementById('blur-hack').focus();
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
        denna funktion används för sista markören om den har tiden "max"
        det som ska tas bort är alltså denna funktion och anropet till den.
        det är tämligen självförklarande om man söker efter funktionsnamnet...
        max-check är redundant när alla låtar (som har db-data sparat) 
        har öppnats i v0.4 eller senare?
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
        
        
        if(time == "max"){
          time = Number(document.getElementById('timeBar').max);
          var song = Troff.getCurrentSong();
          var quickTimeOut = setTimeout(tmpUpdateMarkerSoonBcMax, 42);
        }

        var button = document.createElement("input");
        button.type = "button";
        button.id = nameId;
        button.value = name;
        button.timeValue = time;
        button.info = info;
        button.color = color;

        var buttonS = document.createElement("input");
        buttonS.type = "button";
        buttonS.id = nameId + 'S';
        buttonS.value = 'Stop';
        buttonS.timeValue = time;

        var buttonE = document.createElement("input");
        buttonE.type = "button";
        buttonE.id = nameId + 'E';
        buttonE.value = 'E';
        buttonE.className = "removeButt";

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



    /*
      removeMarker, all, Tar bort en markör från html och DB
    */
    this.removeMarker = function(markerId){
      // Remove Marker from HTML
      $('#'+markerId).closest('li').remove();
      Troff.settAppropriateMarkerDistance();

      // remove from DB
      DB.removeMarker(markerId, strCurrentSong);
    }; // end removeMarker ******/

    /*
      editMarker, all, Editerar en markör i både html och DB
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
      clearAllMarkers - HTML, clears markers
    */
    this.clearAllMarkers = function(){
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
//        var w = window;
//        var d = document;
//        var e = d.documentElement;
//        var g = d.getElementsByTagName('body')[0];
        //var winWidth = w.innerWidth || e.clientWidth || g.clientWidth,
//        var winHeight = w.innerHeight|| e.clientHeight || g.clientHeight;

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

    this.incrementInput = function(identifyer, amount){
        $(identifyer ).val( parseInt($(identifyer).val()) + amount );
        $(identifyer).trigger("change");
    };

    /* end standAlone Functions */




  this.addStartAndEndMarkers = function(){

    var aNewMarkerId = Troff.getNewMarkerIds(2);
    var songLength = Number(document.getElementById('timeBar').max);
    
    var oStartMarker = {};
    oStartMarker.name = "Start";
    oStartMarker.time = 0;
    oStartMarker.id   = aNewMarkerId[0];
    oStartMarker.info = Troff.getStandardMarkerInfo();
    oStartMarker.color = "None";

    
    var oEndMarker = {};
    oEndMarker.name = "End";
    oEndMarker.time = songLength;
    oEndMarker.id   = aNewMarkerId[1];
    oEndMarker.info = "";
    oEndMarker.color = "None";
    
    aMarkers = [oStartMarker, oEndMarker];
    Troff.addMarkers(aMarkers); // adds marker to html
    DB.saveMarkers(Troff.getCurrentSong() ); // tmp saves start and end markers to DB
  };

}; // end TroffClass


var DBClass = function(){



//  var strCurrentSong = "";

  /* every song is stored like this:
     var marker = {"name": time}
     var markers = [marker, marker, marker, ...]
     var song = {
          "markers": markers,
          "tempo": tempo
          "startMarker": markerName,
          "volume": 100,
          "speed": 100,
          "pauseBefStart": [true, 3],
          "startBefore": [false, 3],
          "stopAfter": [false, 3],
          "loopTimes": 1,  -- 1
          "wait": 1
     }

  */
  
  this.cleanSong = function(songId, songObject){
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
        var ret = name.replace(/\s+/g, '_'); //removes blanks (if needed)
        ret = ret.replace(/[^A-Za-z0-9 ]/g, '');
        return ret;
    }

//
//
//
//

    if(songId === "strCurrentSongPath"){
      var path = songObject;
      var galleryId = -1;
      var stroSong = JSON.stringify({"strPath":path, "iGalleryId": galleryId});
      chrome.storage.local.set({'stroCurrentSongPathAndGalleryId': stroSong});
      chrome.storage.local.remove("strCurrentSongPath");
      /*
      
      // nu ska denna göras om till strCurrentSongPathAndGalleryId -'typ' 
      // och sen sparas ner till DB'n!
      och den där nissen ser ut som:
      this.setCurrentSong = function(path, galleryId){
        var stroSong = JSON.stringify({"strPath":path, "iGalleryId": galleryId});
        chrome.storage.local.set({'stroCurrentSongPathAndGalleryId': stroSong});
      };
      

      
      så, jag måste hitta vilket iGalleryId som aktiv låt har , och sen spara ner det till DB'n!
      
      
      
      
      chrome storage local set
      följt av en return!
      */
      return;
    }






    // this if-thing is only here to ease the transition from v 0.2.0.1 to next step.
    // at 2015-02-19, and a later patch at 2015-04-sometime... 
    // this should be removed an around 2015-04??? is 2 months enough? no! not nearly enouth...
    // all the way down to XXX-here-XXX
    if(songObject.currentStartMarker == "#Start" || songObject.currentStartMarker == 0 ) songObject.currentStartMarker = "Start";
    if(songObject.currentStopMarker == "#EndS" || songObject.currentStopMarker == 0) songObject.currentStopMarker = "EndS";
    // bStart o bEnd kollar om start och stopp är tillagda bland de sparade markörerna
    // om de är det så ska de ju inte läggas till igen...
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
    
    // remove from up there to here XXX-here-XXX
    
    
    if(songObject.hasOwnProperty('iWaitBetweenLoops')){
      songObject.wait = songObject.iWaitBetweenLoops;
      delete songObject.iWaitBetweenLoops;
    } 
  
    if(!songObject.startBefore) songObject.startBefore = [false, 4];
    if(!songObject.stopAfter) songObject.stopAfter = [false, 2];
    if(!songObject.pauseBefStart) songObject.pauseBefStart = [true, 3];
    if(!songObject.speed) songObject.speed = 100;
    if(!songObject.volume) songObject.volume = 100;
    if(!songObject.loopTimes) songObject.loopTimes = 1;
    if(!songObject.wait) songObject.wait = 1;
    if(!songObject.info ) songObject.info = "";
    if(!songObject.tempo) songObject.tempo = "?";

    if(songObject.tempo == "NaN") songObject.tempo = "?";
    if(songObject.loopTimes > 9) songObject.loopTimes = "inf";
    
    var obj = {};
    obj[songId] = songObject;
    chrome.storage.local.set(obj);
  }; // end cleanSong


  this.cleanDB = function(){
    chrome.storage.local.get(null, function(items) {   
      var allKeys = Object.keys(items);
      if(allKeys.length === 0){ // This is the first time Troff is started:
        DB.saveSonglists();
        DB.setCurrentTab("songs");
        DB.setCurrentSonglist(0);
      }
      // These is fore the first time Troff is started:
      if(allKeys.indexOf("straoSongLists")   === -1 ) DB.saveSonglists();
      if(allKeys.indexOf("strCurrentTab")    === -1 ) DB.setCurrentTab("songs");
      if(allKeys.indexOf("iCurrentSonglist") === -1 ) DB.setCurrentSonglist(0);
      /*
      if(items.indexOf("straoSongLists") === -1 ){
      
        DB.setCurrentSonglist(0);
        var straoSonglists = JSON.stringify([]);
        chrome.storage.local.set({'straoSongLists': straoSonglists});
      }
      */
      
      for(var key in items){
        if( // skipping all non-songs from DB:
          key === "stroCurrentSongPathAndGalleryId" ||
          key === "iCurrentSonglist" ||
          key === "strCurrentTab" ||
          key === "straoSongLists"
        ) continue;
        DB.cleanSong(key, items[key]);
      }
      /*
      if(items.indexOf("straoSongLists") === -1 ){
        DB.setCurrentSonglist(0);
        var straoSonglists = JSON.stringify([]);
        chrome.storage.local.set({'straoSongLists': straoSonglists});
      }
      */
    });//end get all keys
  };
  
  this.saveSonglists = function(){
    var aoSonglists = [];
    
    var aDOMSonglist = $('#songListPartTheLists li');
    for(var i=0; i<aDOMSonglist.length; i++){
      aoSonglists.push(JSON.parse(aDOMSonglist[i].getAttribute('stroSonglist')));
    }

    var straoSonglists = JSON.stringify(aoSonglists);
    chrome.storage.local.set({'straoSongLists': straoSonglists});
  };


  this.setCurrentTab = function(tab, songId){
    chrome.storage.local.set({'strCurrentTab': tab});
  };
  
  this.setCurrentSonglist = function(iSonglistId){
    chrome.storage.local.set({'iCurrentSonglist': iSonglistId});
  };

  this.setCurrentSong = function(path, galleryId){
    var stroSong = JSON.stringify({"strPath":path, "iGalleryId": galleryId});
    chrome.storage.local.set({'stroCurrentSongPathAndGalleryId': stroSong});
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
  
  this.getCurrentTab = function(){
    chrome.storage.local.get('strCurrentTab', function(ret){
      Troff.setTab(ret['strCurrentTab']);
    });
  };

  this.getCurrentSong = function(){
    chrome.storage.local.get('stroCurrentSongPathAndGalleryId', function(ret){
      var stroSong = ret['stroCurrentSongPathAndGalleryId'];
      if(!stroSong){
        // Slim sim remove 
        /*
          This setTimeout is only to ease the transition between v0.3 to v0.4
          it is not used a single time after they open the app with v0.4 
          so the standard is a oneline:
          if(!stroSong) return;
        */
        setTimeout(DB.getCurrentSong, 0);
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

  this.removeMarker = function(markerId, songId){
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


  this.saveMarkers = function(songId) {
  chrome.storage.local.get(songId, function(ret){
    var aAllMarkers = Troff.getCurrentMarkers();

    var aMarkers = [];
    for(var i=0; i<aAllMarkers.length; i++){
      oMarker = {};
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
    var loadSongMetadata = function(song, songId){

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
      Troff.setWaitBetweenLoops(song.wait);
      Troff.setInfo(song.info);
//      Troff.setTab(song.tab);
      Troff.setTempo(song.tempo);
      Troff.setCurrentSong();

    };// end loadSongMetadata

    chrome.storage.local.get(songId, function(ret){

      var song = ret[songId];
      if(!song){ // new song:
        var songLength = Number(document.getElementById('timeBar').max);

        var oMarkerStart = {};
        oMarkerStart.name = "Start";
        oMarkerStart.time = 0;
        oMarkerStart.info = Troff.getStandardMarkerInfo();
        oMarkerStart.color = "None";
        oMarkerStart.id = "markerNr0";
        var oMarkerEnd = {};
        oMarkerEnd.name  = "End";
        oMarkerEnd.time  = songLength;
        oMarkerEnd.info  = "";
        oMarkerEnd.color = "None";
        oMarkerEnd.id = "markerNr1";
        
        song = {
          "markers": [oMarkerStart, oMarkerEnd],
          "volume": 100,
          "speed": 100,
          "tempo": "?",
          "info": "",
          "pauseBefStart": [true, 3],
          "startBefore": [false, 4],
          "stopAfter": [false, 2],
          "loopTimes": 1,
          "wait": 1,
          "currentStartMarker": oMarkerStart.id,
          "currentStopMarker": (oMarkerEnd.id + 'S')
        };

        var obj = {};
        obj[songId] = song;
        chrome.storage.local.set(obj);
        loadSongMetadata(song, songId);
      } else {
        loadSongMetadata(song, songId);
      }
    });
  }; // end getSongMetadata

};// end DBClass






var IOClass = function(){

  /* this is used to know if button-presses should be in "pop-up"-mode
    or in regular mode */
  var IOEnterFunction = false;

  this.startFunc = function() {
    IO.setSliderHeight();

    document.addEventListener('keydown', IO.keyboardKeydown);
    $('#buttSpacePlay').click( Troff.space );
    $('#buttSpacePause').click( Troff.space );
    $('#buttTip').click(IO.openHelpWindow);

    $('#buttAddStartAndEndMarkers').click(Troff.addStartAndEndMarkers);


    $('#timeBar')[0].addEventListener('change', Troff.timeUpdate );
    $('#volumeBar')[0].addEventListener('change', Troff.volumeUpdate );
    $('#speedBar')[0].addEventListener('change', Troff.speedUpdate );

    $('#buttMarker').click(Troff.createMarker);
    $('#outerImportExportPopUpSquare').click(Troff.toggleImportExport);
    $('#buttImportExportMarker').click(Troff.toggleImportExport);
    $('#buttExportMarker').click(Troff.exportMarker);
    $('#buttImportMarker').click(Troff.importMarker);
    $('#buttPauseBefStart').click(Troff.togglePauseBefStart);
    $('#buttStartBefore').click(Troff.toggleStartBefore);
    // Don't update as the user is typing:
    //$('#startBefore').change(Troff.updateStartBefore);
    $('#startBefore')[0].addEventListener('input', Troff.updateStartBefore);
    
    $('#songlistsTab').click(Troff.selectSonglistsTab);
    $('#songsTab').click(Troff.selectSongsTab);
    $('#songinfoTab').click(Troff.selectSonginfoTab);
    $('#markerinfoTab').click(Troff.selectMarkerinfoTab);

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


    $('#donate').click(function(){
      document.getElementById('blur-hack').focus();
    });
    $('.loopButt').click( Troff.setLoop );
    
    
    $('.shareClass').click(function(){
      document.getElementById('blur-hack').focus();
      var subject = "Troff is a great music player for practicing";
      var body = "Hello\n\n"
        + "I found this great app that is perfect for practicing dancing or "
        + "instruments to songs. "
        + "It let you loop a part of a song, slow it down "
        + "and create markers on the song timeline.\n"
        + "It even supports movies!\n\n"
        + "It is free to download here:\n"
        + "https://chrome.google.com/webstore/detail/"
        + "troff-training-with-music/mebbbmcjdgoipnkpmfjndbolgdnakppl\n\n"
        + "Best regards!";
      var link = "mailto:?&subject="+subject+"&body=" + escape(body);
      window.open(link);
    });

    window.addEventListener('resize', function(){
      IO.setSliderHeight();
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

    //if 0 to 9 or bakspace in a input-field, return,
    //---- site add "or minus, delete, numpad mm"
    if($(':input[type="number"]' ).is(":focus") &&
      (event.keyCode>=48 && event.keyCode<=57 || event.keyCode==8 )){
      return;
    }
    document.getElementById('blur-hack').focus();


    if(event.keyCode>=48 && event.keyCode<=57) {
        // pressed a number
        var number = event.keyCode - 48;
        Troff.setLoopTo(number);
    }


    switch(event.keyCode){
    case 32: //space bar
      Troff.space();
      break;
    case 13: // return
      Troff.enterKnappen();
      break;
    case 27: // esc
      Troff.pauseSong();
      break;
    case 27: // esc
      Troff.pauseSong();
      break;
    case 40: // downArrow
    case 77: // M
      Troff.createMarker();
      break;
    case 80: // P
      if(event.shiftKey==1)
        Troff.incrementInput('#pauseBeforeStart', 1);
      else if(event.altKey==1)
        Troff.incrementInput('#pauseBeforeStart', -1);
      else
        Troff.togglePauseBefStart();
      break;
    case 66: // B
      if(event.shiftKey==1)
        Troff.incrementInput('#startBefore', 1);
      else if(event.altKey==1)
        Troff.incrementInput('#startBefore', -1);
      else
        Troff.toggleStartBefore();
      break;
    case 65: // A
      if(event.shiftKey==1)
        Troff.incrementInput('#stopAfter', 1);
      else if(event.altKey==1)
        Troff.incrementInput('#stopAfter', -1);
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
    case 73: // I
      Troff.focusSongInfoArea();
      break;
    case 79: // O
      Troff.focusMarkerInfoArea();
      break;
    case 69: // E
      Troff.editCurrentInfo();
      break;
    case 70: // F
      Troff.playInFullscreenChanged();
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
        $('#waitBetweenLoops').val(1);
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
    var strHeadline;

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
      "flex-direction: column;"+
      "background-color: cornflowerblue;";


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
      "value": "OK"
    }).click(IOEnterFunction);

    var buttCancel = $("<input>", {
      "type":"button",
      "value": "Cancel"
    }).click(function(){
      if(funcCancle) funcCancle();
      $('#'+outerId).remove();
      IOEnterFunction = false;
    });

    var buttRemove = $("<input>", {
      "type":"button",
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
                   "style":"margin-left:7px; "
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
                        "style":"margin-left:13px; padding: 4px;"
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
        "padding: 10 15px;"+
        "background-color: cornflowerblue;";
    var pStyle = "" +
        "font-size: 18px;";

    var strTextareaHTML ="";
    if(bDouble){
      strTextareaHTML = "<textarea placeholder='"+strTextareaPlaceholder+"'"+
                    "id='"+textareaId+"'>"+strTextarea+"</textarea>";
    } 

    $("body").append($("<div id='"+outerId+"' style='"+outerDivStyle+
               "'><div id='"+innerId+"' style='"+innerDivStyle+
               "'><p style='"+pStyle+"'>" + textHead +
               "</p><input type='text' id='"+textId+
               "'/> "+strTextareaHTML+
               "<input type='button' id='"+buttEnterId+
               "' value='OK'/><input type='button' id='"+buttCancelId+
               "' value='Cancel'/></div></div>"));

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
          "padding: 10 15px;"+
          "background-color: cornflowerblue;";
      var pStyle = "" +
          "margin: 6px 0;";

      $("body").append($("<div id='"+outerId+"' style='"+outerDivStyle+
                 "'><div id='"+innerId+"' style='"+innerDivStyle+
                 "'><h2>" + textHead +
                 "</h2><p style='"+pStyle+"'>" + textBox +
                 "</p><div><input type='button' id='"+buttEnterId+
                 "' value='OK'/><input type='button' id='"+buttCancelId+
                 "' value='Cancel'/></div></div></div>"));

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
          "padding: 10 15px;"+
          "background-color: cornflowerblue;";
      var hStyle = "" +
          "font-size: 18px;";
      var pStyle = "" +
          "font-size: 14px;";

      if(textBox){
          $("body").append($("<div id='"+outerId+"' style='"+outerDivStyle+
                     "'><div id='"+innerId+"' style='"+innerDivStyle+
                     "'><h2 style='"+hStyle+"'>" + textHead +
                     "</h2><p style='"+pStyle+"' type='text' id='"+textId+
                     "'>"+textBox+"</p> <input type='button' id='"+buttEnterId+
                     "' value='OK'/></div></div>"));
          $("#"+textId).val(textBox).select();
      } else {
          $("body").append($("<div id='"+outerId+"' style='"+outerDivStyle+
                  "'><div id='"+innerId+"' style='"+innerDivStyle+
                  "'><p style='"+pStyle+"'>" + textHead +
                  "</p><input type='button' id='"+buttEnterId+
                  "' value='OK'/></div></div>"));
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
    chrome.app.window.create('help.html');
    document.getElementById('blur-hack').focus();
  };

  this.setSliderHeight = function() {
    var iHeight = IO.calcRestHeightFrom('#div_to_calc_height_of_timeSection, #buttResetVolume, #plussMinusButtons, #volumeDataOutput, nav');
    var sliderHeight = Math.max(iHeight, 40);
    $('#volumeBar, #speedBar').height(sliderHeight);
  };

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

  this.loopTimesLeft = function(input){
    if(!input)
        return $('#loopTimesLeft').text();
    if(input == -1)
        $('#loopTimesLeft').html( $('#loopTimesLeft').text() -1 );
    else
        $('#loopTimesLeft').html( input );
  };

}; // end IOClass

var Troff = new TroffClass();
var DB = new DBClass();
var IO = new IOClass();

$(document).ready( function() {
  
  DB.cleanDB();
  DB.getAllSonglists();
  DB.getCurrentTab();
  IO.startFunc();
  //FS.startFunc();
  FSstartFunk();
  DB.getCurrentSong();


});
