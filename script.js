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
  document.getElementById("gallery").innerHTML = "";
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

    DB.setCurrentSong(path);

    Troff.setWaitForLoad(path);
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
  var optGrp = document.createElement("h3");
  optGrp.appendChild(document.createTextNode(name));
  optGrp.setAttribute("id", id);
  document.getElementById("gallery").appendChild(optGrp);
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


    var pap = document.createElement("button");
    pap.setAttribute("class", "mediaButton");
    pap.appendChild(document.createTextNode(Troff.pathToName(itemEntry.fullPath)));
    pap.setAttribute("data-fullpath", itemEntry.fullPath );
    pap.setAttribute("data-fsid", mData.galleryId );
    pap.addEventListener('click', function(a, b, c){
      var selectedSong = document.querySelector('#gallery .selected');
      if(selectedSong)
        selectedSong.classList.remove("selected");

      this.classList.add("selected");

      setSong(itemEntry.fullPath, mData.galleryId);
    });
    if(itemEntry.fullPath == DB.strCurrentSong)
      pap.click();

    document.getElementById("gallery").appendChild(pap);
   } else {


    var group = document.createElement("h3");
    gruop.appendChild(document.createTextNode(itemEntry.name));

    document.getElementById("gallery").appendChild(group);
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
    return;
  }
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].isFile) {
      addItem(entries[i]);
      gGalleryData[gGalleryIndex].numFiles++;
      (function(galData) {
        entries[i].getMetadata(function(metadata){
          galData.sizeBytes += metadata.size;
        });
      }(gGalleryData[gGalleryIndex]));
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
    return "Type marker specific info here";
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
          var songLength = parseInt(document.getElementById('timeBar').max);
          
          var oMarker = {};
          oMarker.name = "End";
          oMarker.time = songLength;
          oMarker.info = Troff.getStandardMarkerInfo();
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

  this.setWaitForLoad = function(path){
    if(strCurrentSong){
        Troff.pauseSong();
        Troff.clearAllMarkers();
        Troff.setTempo('?');
        Troff.setWaitBetweenLoops(1);
    }
    strCurrentSong = path;

    $('#currentArtist').text("Wait for song to load");
    $('#infoSection, #currentSong, #currentAlbum').hide();
  };

  this.setCurrentSong = function(){
    DB.setCurrentSong(strCurrentSong);
    $('#infoSection').show();
  }; // end SetCurrentSong

  this.pathToName = function(filepath){
    // ska jag ha 1 eller filepath.lastIndexOf('/') ???
    return filepath.substr(1,filepath.lastIndexOf('.') - 1);
  };

  this.getCurrentMarkers = function(bGetStopMarkers){
    if(bGetStopMarkers){
      return $('#markerList li input:nth-child(5)');
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
      var oTmp = {};
      for (var i=0; i<aoMarkers.length; i++){
        oTmp.name = aoMarkers[i].name;
        oTmp.time = aoMarkers[i].time;
        oTmp.info = aoMarkers[i].info;
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
        var tmpName = Object.keys(aMarkers[i])[0];
        aMarkers[i].name = aMarkers[i].name || tmpName;
        aMarkers[i].time = aMarkers[i].time || parseInt(aMarkers[i][tmpName]);
        aMarkers[i].info = aMarkers[i].info || Troff.getStandardMarkerInfo();
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
      oFI.strInput = "marker nr " + iMarkers;
      oFI.bDouble = true;
      oFI.strTextarea = "";
      oFI.strTextareaPlaceholder = "Add extra info about the marker here.";
      IO.promptDouble(oFI, function(markerName, markerInfo){
      if(markerName === "") return;

      var oMarker = {};
      oMarker.name = markerName;
      oMarker.time = time;
      oMarker.info = markerInfo || Troff.getStandardMarkerInfo();
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

    this.addMarkers = function(aMarkers){

      var tmpUpdateMarkerSoonBcMax = function(){
        DB.updateMarker(nameId, name, info, parseInt(time), song);
        clearInterval(quickTimeOut);
      };

      for(var i=0; i<aMarkers.length; i++) {
        var oMarker = aMarkers[i];
        var name = oMarker.name;
        var time = oMarker.time;
        var info = oMarker.info;
        var nameId = oMarker.id;


        if(!nameId){ // slim sim remove!
          IO.alert("why is there no nameId (or markerId) with this marker!?");
          console.error("why is there no nameId (or markerId) with this marker!?");
          console.error("i = " + i);
          console.log("aMarkers[i]:");
          console.log(aMarkers[i]);
          return -1;
        }
        
        
        if(time == "max"){
          time = parseInt(document.getElementById('timeBar').max);
          var song = Troff.getCurrentSong();
          var quickTimeOut = setTimeout(tmpUpdateMarkerSoonBcMax, 42);
        }

        var button = document.createElement("input");
        button.type = "button";
        button.id = nameId;
        button.value = name;
        button.timeValue = time;
        button.info = info;

        var buttonI = document.createElement("input");
        buttonI.type = "button";
        buttonI.id = nameId + 'I';
        buttonI.value = 'Info';
//        buttonI.info = info;

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

        // site vart är motsvarande för denna:
        // var song = JSON.parse(localStorage.getItem(
            //document.getElementById('audioPlayer').songId));

        var p = document.createElement("b");
        p.innerHTML = Troff.secToDisp(time);

        var docMarkerList = document.getElementById('markerList');
        var listElement = document.createElement("li");

        listElement.appendChild(buttonE);
        listElement.appendChild(p);
        listElement.appendChild(button);
        listElement.appendChild(buttonI);
        listElement.appendChild(buttonS);


        var child = $('#markerList li:first-child')[0];
        var bInserted = false;
        var bContinue = false;
        while(child) {
          var childTime = child.childNodes[2].timeValue;
          if(childTime != null && Math.abs(time - childTime) < 0.001){

            if(child.childNodes[2].value != name){

              var oldMarkerId = child.childNodes[2].id;
              var newMarkerName = child.childNodes[2].value + ", " + name;

              updated = true;

              var newMarkerId = Troff.getNewMarkerId();

              if($('.currentMarker')[0].id == child.childNodes[2].id)
                DB.setCurrentStartMarker(newMarkerId, strCurrentSong);
              if($('.currentStopMarker')[0].id == child.childNodes[3].id)
                DB.setCurrentStopMarker(newMarkerId, strCurrentSong);

              $('#'+oldMarkerId).val(newMarkerName);
              $('#'+oldMarkerId).attr("id", newMarkerId);
              $('#'+oldMarkerId + 'E').attr("id", newMarkerId + 'E');
              $('#'+oldMarkerId + 'S').attr("id", newMarkerId + 'S');

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


//site site site

// TODO: här ska jag fixa så att om en markör som är selectad (start, och kanske end?)
// får en text-ökning (i form av att en annan markör antingen importeras
// eller som läggs till välldigt nära) så ska DB.selectedStartMarker eller
// DB.selectedStopMarker updateras!



        if( bContinue ) continue;
        if ( !bInserted ) {
          docMarkerList.appendChild(listElement);
        }

        document.getElementById(nameId).addEventListener('click', function() {
          Troff.selectMarker(this.id);
          document.getElementById('blur-hack').focus();
        });
        document.getElementById(nameId + 'S').addEventListener('click', function() {
          Troff.selectStopMarker(this.id);
          document.getElementById('blur-hack').focus();
        });
        document.getElementById(nameId + 'I').addEventListener('click', function() {
          // sending the buttonId instead of the infoId
          Troff.showInfo( this.id.slice(0,-1) );
          document.getElementById('blur-hack').focus();
        });
        document.getElementById(nameId + 'E').addEventListener('click', function() {
          Troff.editMarker(this.id.slice(0,-1));
          document.getElementById('blur-hack').focus();
        });
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

      Troff.settAppropriateActivePlayRegion();
      document.getElementById('blur-hack').focus();
      DB.setCurrentStartMarker(0, strCurrentSong );
    };
    
    this.unselectStopMarker = function(){

      var aFirstAndLast = Troff.getFirstAndLastMarkers();
      var startMarkerId = aFirstAndLast[0];
      var stopMarkerId = aFirstAndLast[1] + 'S';


      $('.currentStopMarker').removeClass('currentStopMarker');
      $('#' + stopMarkerId).addClass('currentStopMarker');

      Troff.settAppropriateActivePlayRegion();
      document.getElementById('blur-hack').focus();
      DB.setCurrentStopMarker(0, strCurrentSong );
    };

    /*
      selectMarker - All, sets new Marker, sets playtime to markers playtime
    */
    this.selectMarker = function(markerId){
      var startTime = parseInt($('#'+markerId)[0].timeValue);
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

      Troff.goToStartMarker();
      Troff.settAppropriateActivePlayRegion();

      DB.setCurrentStartAndStopMarker(markerId, stopMarker, strCurrentSong);
    }; // end selectMarker

    /*
      selectStopMarker - All, selects a marker to stop playing at
    */
    this.selectStopMarker = function(markerId){
      var stopTime = parseInt($('#'+markerId)[0].timeValue);
      var startTime = Troff.getStartTime();

      // if Marker after stopMarker - unselect Marker:
      if((startTime + 0.5) >= stopTime ){
        var aFirstAndLast = Troff.getFirstAndLastMarkers();
        var firstMarkerId = aFirstAndLast[0];
        var lastMarkerId = aFirstAndLast[1] + 'S';

        $('.currentMarker').removeClass('currentMarker');
        $('#' + firstMarkerId).addClass('currentMarker');
      }

      var startMarker = $('.currentMarker').attr('id');
      startMarker = startMarker ? startMarker : 0;

      //marks selected StopMarker:
      $('.currentStopMarker').removeClass('currentStopMarker');
      $('#'+markerId).addClass('currentStopMarker');


      Troff.settAppropriateActivePlayRegion();
      DB.setCurrentStartAndStopMarker(startMarker, markerId, strCurrentSong);

    }; // end selectStopMarker

    this.showInfo = function(id){
      var info = $('#' + id)[0].info;
      IO.alert(info);
    };

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
      editMarker, all, Tar bort en markör från html och DB
    */
    this.editMarker = function(markerId){
      var oldName  = $('#'+markerId).val();
      var oldTime = parseInt($('#'+markerId)[0].timeValue);
      var oldMarkerInfo = $('#'+markerId)[0].info;

      var text = "Please enter new marker name here";
      IO.promptEditMarker(markerId, function(newMarkerName, newMarkerInfo, newTime){

      if(newMarkerName == null || newMarkerName == "" ||
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
      }

      // update HTML Time
      if(newTime != oldTime){
        updated = true;

        $('#'+markerId)[0].timeValue = newTime;
        $('#'+markerId + 'S')[0].timeValue = newTime;
        Troff.settAppropriateMarkerDistance();

        var startTime = parseInt($('.currentMarker')[0].timeValue);
        var stopTime = parseInt($('.currentStopMarker')[0].timeValue);

        if( startTime >= stopTime ){
            $('.currentStopMarker').removeClass('currentStopMarker');
            Troff.settAppropriateActivePlayRegion();
        }
        $('#'+markerId).prev().html( Troff.secToDisp(newTime) );
      }

      // update name and time and info in DB, if nessessarry
      if(updated){
        DB.updateMarker(
          markerId, 
          newMarkerName,
          newMarkerInfo,
          parseInt(newTime), 
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

            child.setAttribute("style", "margin-top: "+ marginTop +"px;", true);
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
    var songLength = parseInt(document.getElementById('timeBar').max);
    
    var oStartMarker = {};
    oStartMarker.name = "Start";
    oStartMarker.time = 0;
    oStartMarker.id   = aNewMarkerId[0];
    oStartMarker.info = Troff.getStandardMarkerInfo();

    
    var oEndMarker = {};
    oEndMarker.name = "End";
    oEndMarker.time = songLength;
    oEndMarker.id   = aNewMarkerId[1];
    oEndMarker.info = Troff.getStandardMarkerInfo();
    
    aMarkers = [oStartMarker, oEndMarker];
    Troff.addMarkers(aMarkers); // adds marker to html
    DB.saveMarkers(Troff.getCurrentSong() ); // tmp saves start and end markers to DB
  };

}; // end TroffClass


var DBClass = function(){



  var strCurrentSong = "";

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
          "loop": "off",   -- remove!!!
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
        var id = "markerNr" + i;
        var info = Troff.getStandardMarkerInfo();
        
        if( markerNameToId(name) == songObject.currentStartMarker){
          songObject.currentStartMarker = id;
        }
        if( (markerNameToId(name) + 'S') == songObject.currentStopMarker){
          songObject.currentStopMarker = id + 'S';
        }
        
        var oMarker = {};
        oMarker.name = name;
        oMarker.time = time;
        oMarker.id   = id;
        oMarker.info = info;
        
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
    if(!songObject.tempo) songObject.tempo = "?";
    if(songObject.tempo == "NaN") songObject.tempo = "?";
    
    var obj = {};
    obj[songId] = songObject;
    chrome.storage.local.set(obj);
  }; // end cleanSong


  this.cleanDB = function(){
    chrome.storage.local.get(null, function(items) {   
      var allKeys = Object.keys(items);
      for(var key in items){
        if(key === "strCurrentSongPath") continue;
        DB.cleanSong(key, items[key]);
      }
    });
  };


  this.setCurrentSong = function(path){
    chrome.storage.local.set({'strCurrentSongPath': path});
  };

  this.getCurrentSong = function(){
    chrome.storage.local.get('strCurrentSongPath', function(ret){
        DB.strCurrentSong = ret['strCurrentSongPath'];
    });
  };

  this.removeMarker = function(markerId, songId){
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song)
        console.error('Error "removeMarker, noSong" occurred, songId=' + songId);
    for(var i=0; i<song.markers.length; i++){
      if(song.markers[i].id == markerId){
          song.markers.splice(i,1); //
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

  this.updateMarker = function(markerId, newName, newInfo, newTime, songId){
  chrome.storage.local.get(songId, function(ret){
    var song = ret[songId];
    if(!song)
      console.error('Error "updateMarker, noSong" occurred, songId=' + songId);
    for(var i=0; i<song.markers.length; i++){
      if(song.markers[i].id == markerId){
        song.markers[i].name = newName;
        song.markers[i].time = newTime;
        song.markers[i].info = newInfo;
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
      oMarker.name = aAllMarkers[i].value;
      oMarker.time = aAllMarkers[i].timeValue;
      oMarker.info = aAllMarkers[i].info;
      oMarker.id   = aAllMarkers[i].id;
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
  this.setCurrentLoopMode = function(songId, mode){
      if(mode == 'off' || mode == 'times' || mode == 'inf')
          DB.setCurrent(songId, 'loop', mode);
      else
          console.error("Did not recognize the mode: " + mode);
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
      Troff.setTempo(song.tempo);
      Troff.setCurrentSong(songId); // site is this nessessarry??? det enda den gör är att anropa DB.setCurrentSong (som sparar strCurrentSong i DB) och kör Show-infosection...

    };// end loadSongMetadata

    chrome.storage.local.get(songId, function(ret){

      var song = ret[songId];
      if(!song){ // new song:
        var songLength = parseInt(document.getElementById('timeBar').max);

        var oMarkerStart = {};
        oMarkerStart.name = "Start";
        oMarkerStart.time = 0;
        oMarkerStart.info = Troff.getStandardMarkerInfo();
        oMarkerStart.id = "markerNr0";
        var oMarkerEnd = {};
        oMarkerEnd.name = "End";
        oMarkerEnd.time = songLength;
        oMarkerEnd.info = Troff.getStandardMarkerInfo();
        oMarkerEnd.id = "markerNr1";
        
        song = {
          "markers": [oMarkerStart, oMarkerEnd],
          "volume": 100,
          "speed": 100,
          "tempo": "?",
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

    window.addEventListener('resize', function(){
      IO.setSliderHeight();
      Troff.settAppropriateMarkerDistance();
    });

  };//end startFunc

  this.keyboardKeydown  = function(event) {
    if(IOEnterFunction){
      if(event.keyCode == 13){
        IOEnterFunction();
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
      //console.log("key " + event.keyCode);
      //nothing
    }// end switch

  }; // end keyboardKeydown *****************/



  this.promptEditMarker = function(markerId, func, funcCancle){

    var time = Date.now();

    var textId = "textId" + time;
    var markerNameId = "markerNameId" + time;
    var markerTimeId = "markerTimeId" + time;
    var markerInfoId = "markerInfoId" + time;
    var outerId = "outerId" + time;
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
        $("#"+markerTimeId).val()
      );
      $('#'+outerId).remove();
      IOEnterFunction = false;
    };


    var markerName = $('#'+markerId).val();
    var markerInfo = $('#'+markerId)[0].info;
    var markerTime = parseInt($('#'+markerId)[0].timeValue);

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


      IO.confirm("Remove marker", "Are you sure?", function(){
        Troff.removeMarker(markerId);
      });
    });


    var row0 = $("<span>", {"class": "oneRow"})
               .append($("<h2>", {"id": "p1"}).append("Edit marker"));


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
                    .append($("<p>").append("Remove this marker:"))
                    .append(buttRemove);

    var row5 = $("<span>", {"class": "oneRow"})
                    .append(buttOK)
                    .append(buttCancel);

    $('body')
        .append(
            $("<div>", {"id": outerId, "style": outerDivStyle})
                .append(
                    $("<div>", {"id": "test3","style": innerDivStyle})
                        .append(row0)
                        .append(row1)
                        .append(row2)
                        .append(row3)
                        .append(row4)
                        .append(row5)
                )// end inner div
        );// end outer div

    var quickTimeOut = setTimeout(function(){
        $("#"+markerNameId).select();
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
    /*window.open('help.html',
      'slimSim',
      'toolbar=no,'+
      'location=no,'+
      'directories=no,'+
      'status=no,'+
      'menubar=no,'+
      'resizable=yes,'+
      'copyhistory=no,'+
      'scrollbars=yes,'+
      'width=750,'+
      'height=525');
    */
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
    
    DB.getCurrentSong();
    //FS.startFunc();

    IO.startFunc();
    FSstartFunk();


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




});
