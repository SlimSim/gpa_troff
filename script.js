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

window.alert = function( alert){
	console.warn("Alert:", alert);
}



var gGalleryIndex = 0;     // gallery currently being iterated
var gGalleryReader = null; // the filesytem reader for the current gallery
var gDirectories = [];     // used to process subdirectories
var gGalleryArray = [];    // holds information about all top-level Galleries found - list of DomFileSystem
var gGalleryData = [];     // hold computed information about each Gallery
var gCurOptGrp = null;

var imgFormats = ['png', 'bmp', 'jpeg', 'jpg', 'gif', 'png', 'svg', 'xbm', 'webp'];
var audFormats = ['wav', 'mp3', 'm4a'];
var vidFormats = ['3gp', '3gpp', 'avi', 'flv', 'mov', 'mpeg', 'mpeg4', 'mp4', 'ogg', 'webm', 'wmv'];

var TROFF_SETTING_SET_THEME = "TROFF_SETTING_SET_THEME";
var TROFF_SETTING_EXTENDED_MARKER_COLOR = "TROFF_SETTING_EXTENDED_MARKER_COLOR";
var TROFF_SETTING_EXTRA_EXTENDED_MARKER_COLOR = "TROFF_SETTING_EXTRA_EXTENDED_MARKER_COLOR";
var TROFF_SETTING_ENTER_GO_TO_MARKER_BEHAVIOUR = "TROFF_SETTING_ENTER_GO_TO_MARKER_BEHAVIOUR";
var TROFF_SETTING_ENTER_USE_TIMER_BEHAVIOUR = "TROFF_SETTING_ENTER_USE_TIMER_BEHAVIOUR";
var TROFF_SETTING_SPACE_GO_TO_MARKER_BEHAVIOUR = "TROFF_SETTING_SPACE_GO_TO_MARKER_BEHAVIOUR";
var TROFF_SETTING_ENTER_RESET_COUNTER = "TROFF_SETTING_ENTER_RESET_COUNTER";
var TROFF_SETTING_SPACE_RESET_COUNTER = "TROFF_SETTING_SPACE_RESET_COUNTER";
var TROFF_SETTING_PLAY_UI_BUTTON_RESET_COUNTER = "TROFF_SETTING_PLAY_UI_BUTTON_RESET_COUNTER";
var TROFF_SETTING_SPACE_USE_TIMER_BEHAVIOUR = "TROFF_SETTING_SPACE_USE_TIMER_BEHAVIOUR";
var TROFF_SETTING_PLAY_UI_BUTTON_GO_TO_MARKER_BEHAVIOUR = "TROFF_SETTING_PLAY_UI_BUTTON_GO_TO_MARKER_BEHAVIOUR";
var TROFF_SETTING_PLAY_UI_BUTTON_USE_TIMER_BEHAVIOUR = "TROFF_SETTING_PLAY_UI_BUTTON_USE_TIMER_BEHAVIOUR";
var TROFF_SETTING_PLAY_UI_BUTTON_SHOW_BUTTON = "TROFF_SETTING_PLAY_UI_BUTTON_SHOW_BUTTON";
var TROFF_SETTING_ON_SELECT_MARKER_GO_TO_MARKER = "TROFF_SETTING_ON_SELECT_MARKER_GO_TO_MARKER";
var TROFF_SETTING_CONFIRM_DELETE_MARKER = "TROFF_SETTING_CONFIRM_DELETE_MARKER";
var TROFF_SETTING_UI_ARTIST_SHOW = "TROFF_SETTING_UI_ARTIST_SHOW";
var TROFF_SETTING_UI_TITLE_SHOW = "TROFF_SETTING_UI_TITLE_SHOW";
var TROFF_SETTING_UI_ALBUM_SHOW = "TROFF_SETTING_UI_ALBUM_SHOW";
var TROFF_SETTING_UI_PATH_SHOW = "TROFF_SETTING_UI_PATH_SHOW";
var TROFF_SETTING_UI_PLAY_FULL_SONG_BUTTONS_SHOW = "TROFF_SETTING_UI_PLAY_FULL_SONG_BUTTONS_SHOW";
var TROFF_SETTING_UI_ZOOM_SHOW = "TROFF_SETTING_UI_ZOOM_SHOW";
var TROFF_SETTING_UI_LOOP_BUTTONS_SHOW = "TROFF_SETTING_UI_LOOP_BUTTONS_SHOW";
var TROFF_SETTING_SONG_COLUMN_TOGGLE = "TROFF_SETTING_SONG_COLUMN_TOGGLE";
var TROFF_SETTING_SONG_LISTS_LIST_SHOW = "TROFF_SETTING_SONG_LISTS_LIST_SHOW";
var TROFF_CURRENT_STATE_OF_SONG_LISTS = "TROFF_CURRENT_STATE_OF_SONG_LISTS";

var TROFF_SETTING_KEYS = [
	"stroCurrentSongPathAndGalleryId",
	"iCurrentSonglist",
	"zoomDontShowAgain",
	"abGeneralAreas",
	"straoSongLists",
	TROFF_SETTING_SET_THEME,
	TROFF_SETTING_EXTENDED_MARKER_COLOR,
	TROFF_SETTING_EXTRA_EXTENDED_MARKER_COLOR,
	TROFF_SETTING_ENTER_GO_TO_MARKER_BEHAVIOUR,
	TROFF_SETTING_ENTER_USE_TIMER_BEHAVIOUR,
	TROFF_SETTING_SPACE_GO_TO_MARKER_BEHAVIOUR,
	TROFF_SETTING_ENTER_RESET_COUNTER,
	TROFF_SETTING_SPACE_RESET_COUNTER,
	TROFF_SETTING_PLAY_UI_BUTTON_RESET_COUNTER,
	TROFF_SETTING_SPACE_USE_TIMER_BEHAVIOUR,
	TROFF_SETTING_PLAY_UI_BUTTON_GO_TO_MARKER_BEHAVIOUR,
	TROFF_SETTING_PLAY_UI_BUTTON_USE_TIMER_BEHAVIOUR,
	TROFF_SETTING_PLAY_UI_BUTTON_SHOW_BUTTON,
	TROFF_SETTING_ON_SELECT_MARKER_GO_TO_MARKER,
	TROFF_SETTING_CONFIRM_DELETE_MARKER,
	TROFF_SETTING_UI_ARTIST_SHOW,
	TROFF_SETTING_UI_TITLE_SHOW,
	TROFF_SETTING_UI_ALBUM_SHOW,
	TROFF_SETTING_UI_PATH_SHOW,
	TROFF_SETTING_UI_PLAY_FULL_SONG_BUTTONS_SHOW,
	TROFF_SETTING_UI_ZOOM_SHOW,
	TROFF_SETTING_UI_LOOP_BUTTONS_SHOW,
	TROFF_SETTING_SONG_COLUMN_TOGGLE,
	TROFF_SETTING_SONG_LISTS_LIST_SHOW,
	TROFF_CURRENT_STATE_OF_SONG_LISTS,
];


var MARKER_COLOR_PREFIX = "markerColor";

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
	var videoBox = document.createElement('div');
	var image = document.createElement('img');

	videoBox.setAttribute('id', "videoBox");
	image.classList.add( "contain-object" );
	image.classList.add( "full-width" );
	Troff.setMedatadaImage(image);
	Troff.setImageLayout();

	var fsButton = document.createElement('button');
	fsButton.addEventListener('click', Troff.forceFullscreenChange );
	fsButton.appendChild( document.createTextNode('Fullscreen (F)') );
	content_div.appendChild(fsButton);
	videoBox.appendChild(image);
	content_div.appendChild(videoBox);

	return image;
}

function addAudioToContentDiv() {
	var content_div = document.getElementById('content');
	var audio = document.createElement('audio');
	audio.addEventListener('loadedmetadata', function(e){
		Troff.setMetadata(audio);
		Troff.setAudioVideoLayout();
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


	fsButton.addEventListener('click', Troff.playInFullscreenChanged);
	fsButton.appendChild( document.createTextNode('Play in Fullscreen') );
	fsButton.setAttribute('id', "playInFullscreenButt");
	fsButton.setAttribute('class', "onOffButton mt-2 mr-2");
	
	videoBox.setAttribute('id', "videoBox");

	video.addEventListener('loadedmetadata', function(e){
		Troff.setMetadata(video);
		Troff.setAudioVideoLayout();
	});

	content_div.appendChild(fsButton);

	content_div.appendChild( $("<button>")
		.text("Mirror Image")
		.attr( "id", "mirrorImageButt")
		.click( Troff.mirrorImageChanged )
		.addClass("onOffButton mt-2 mr-2")[0] )
	
	videoBox.appendChild(video);
	content_div.appendChild(videoBox);
	return video;
}

function getFileExtension( filename ){
	return filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();
}

function getFileType(filename) {
	 var ext = getFileExtension( filename );
	 if (imgFormats.indexOf(ext) >= 0)
			return "image";
	 else if (audFormats.indexOf(ext) >= 0)
			return "audio";
	 else if (vidFormats.indexOf(ext) >= 0)
			return "video";
	 else return null;
}

function getFileTypeFaIcon( filename ) {
	var type = getFileType( filename );

	switch(type){
	case "image":
		return "fa-image";
	case "audio":
		return "fa-music";
	case "video":
		return "fa-film";
	}
	return "fa-question";
}

function clearContentDiv() {
	 var content_div = document.getElementById('content');
	 while (content_div.childNodes.length >= 1) {
			content_div.removeChild(content_div.firstChild);
	 }
}

function clearList() {
	document.getElementById("newSongListPartAllSongs").innerHTML = "";
	$('#dataSongTable').DataTable().clear().draw();
}

function clearGalleryAndDirectoryList() {
	$("#galleryList").empty();
	$("#directoryList").empty();
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

	$("#gallery")
		.children()
		.removeClass( "selected" )
		.filter( 'button[fullpath="' + fullPath + '"][galleryid="' + galleryId + '"]' )
		.addClass( "selected" );

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
								$( "#currentPath" ).text( Troff.pathToName( path ) );
								if(metadata.title){
									$('#currentSong').text( metadata.title ).show();
								} else {
									$('#currentArtist').text(Troff.pathToName(path));
								}
								if(metadata.artist)
									$('#currentArtist').text( metadata.artist );
								if(metadata.album)
									$('#currentAlbum').text ( metadata.album ).show();
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

function sortAndValue(sortValue, stringValue) {
	if( sortValue === undefined )
		return "<i class=\"hidden\">" + 0 + "</i>";//<i class=\"fa " + faType + "\"></i>",
	return "<i class=\"hidden\">" + sortValue + "</i>" + stringValue;//<i class=\"fa " + faType + "\"></i>",
}



function addDirectory_NEW(directoryEntry) {
	var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(directoryEntry.filesystem)

	$( "#directoryList" )
		.append(
			$("<ul>")
				.addClass("py-1")
				.append( $( "<button>" )
					.addClass("stOnOffButton")
					.attr("data-full-path", directoryEntry.fullPath )
					.attr("data-gallery-id", mData.galleryId)
					.text( directoryEntry.name )
					.click(clickSongList_NEW)
			)
		);
}

function addGallery_New(name, galleryId) {
	$( "#galleryList" )
		.append(
			$("<ul>")
				.addClass("py-1")
				.append( $( "<button>" )
					.addClass("stOnOffButton")
					.addClass("text-left")
					.attr("data-gallery-id", galleryId)
					.text( Troff.getLastSlashName(name) )
					.click(clickSongList_NEW)
			)
		);
}

function clickSongList_NEW( event ) {
	document.getElementById('blur-hack').focus();
	var $target = $(event.target),
		data = $target.data("songList"),
		galleryId = $target.attr("data-gallery-id"),
		fullPath = $target.attr("data-full-path");

	$( "#songListAll_NEW" ).removeClass( "selected" );

	if( $("#TROFF_SETTING_SONG_LIST_ADDITIVE_SELECT").hasClass( "active" ) ) {

		if( data || galleryId ) {
			$target.toggleClass( "active" );
			$( "#songListsList" ).find( "button" ).removeClass("selected");
		} else {
			// It only enters here IF the All songs-button is pressed :)
			$( "#songListsList" ).find( "button" ).removeClass("selected").removeClass("active");			
			$target.addClass("selected");
		}
	} else {
		$( "#songListsList" ).find( "button" ).removeClass("selected").removeClass("active");
		$target.addClass( "selected" );
	}

	Troff.saveCurrentStateOfSonglists();

	filterSongTable( getFilterDataList() );

}

function filterSongTable( list ) {
	if( list.length === 0 ) {
		$( "#songListAll_NEW" ).addClass( "selected" );
	}

	regex = list.join("|");
	$('#dataSongTable').DataTable()
		.columns( 0 )
		.search( regex, true, false )
		.draw();

}

function getFilterDataList(){
	var list = [];

	$( "#directoryList, #galleryList").find("button").filter( ".active, .selected" ).each(function(i, v){
		var fullPath = $(v).attr("data-full-path");
		var galleryId = $(v).attr("data-gallery-id");

		if( fullPath ) {
			list.push( "^{\"galleryId\":\"" + galleryId + "\",\"fullPath\":\"" + escapeRegExp( fullPath ) );
		} else {
			list.push( "^{\"galleryId\":\"" + galleryId + "\"" );
		}
	} );

	$( "#songListsList").find("button").filter( ".active, .selected" ).each(function(i, v){
		var innerData = $(v).data("songList");

		if( innerData ) {
			$.each(innerData.songs, function(i, vi) {
				if( vi.isDirectory ) {
					list.push( "^{\"galleryId\":\"" + vi.galleryId + "\"" );
				} else {
					list.push( "\"fullPath\":\"" + escapeRegExp(vi.fullPath) + "\"}$" );
				}
			} );
		}
	} );
	return list;
}

function escapeRegExp(string) {
	return string
		.replace("\"", "\\\"") // wierd extra escaping of > \" <
		.replace(/[".*+?^${}()|[\]\\]/g, '\\$&');	// $& means the whole matched string
}


function addItem_NEW(itemEntry) {
	itemEntry.file(function(file) {
		chrome.mediaGalleries.getMetadata(file, {}, function(metadata) {
			var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(itemEntry.filesystem);
			var fullPath = itemEntry.fullPath;
			var galleryId = mData.galleryId;
			var extension = getFileExtension( fullPath );
			var faType = getFileTypeFaIcon(fullPath);

				var selected_path = Troff.getCurrentSong();
				var selected_galleryId = Troff.getCurrentGalleryId();



			DB.getVal( fullPath, function( song ) {

				var tempo = "?",
					info = "",
					titleOrFileName = metadata.title || file.name.substr(0, file.name.lastIndexOf( '.' ) - 1);
				if( song != undefined ) {
					tempo = song.tempo;
					info = song.info;
				}

				var dataInfo = {
					"galleryId" : galleryId,
					"fullPath" : fullPath
				};

				var newRow = $('#dataSongTable').DataTable().row.add( [
					JSON.stringify( dataInfo ),
//					null, // Play
					null, // Menu ( Hidden TODO: bring forward and implement )
					sortAndValue(faType, "<i class=\"fa " + faType + "\"></i>"),//type
					sortAndValue( metadata.duration, Troff.secToDisp( metadata.duration ) ),//Duration
					titleOrFileName,
					metadata.title || "",
					metadata.artist || "",
					metadata.album || "",
					tempo,
					metadata.genre || "",
					mData.name + itemEntry.fullPath, //File Path
					Troff.milisToDisp( file.lastModified ),
					sortAndValue( file.size, Troff.byteToDisp( file.size ) ), 
					info,
					"." + extension
				] )
				.draw( false )
				.node();

				if(selected_path == fullPath && selected_galleryId == galleryId){
					$( newRow ).addClass( "selected" );
				}

			} ); // end DB.getVal
		} ); // end chrome.mediaGalleries.getMetadata-function
	} );//end fileEntry.file-function
}

function initSongTable() {
	var dataSongTable,
		selectAllCheckbox = $( '<div class="checkbox preventSongLoad"><label><input type="checkbox" value=""><span class="cr"><i class="cr-icon fa fa-check"></i></span></label></div>' );

	selectAllCheckbox.click( function( event ) {
		var headerCheckbox = $( "#dataSongTable" ).find( "th" ).find( "input[type=checkbox]" ),
			allCheckboxes = $( "#dataSongTable" ).find( "td" ).find( "input[type=checkbox]" );
		if( headerCheckbox.is( ":checked" ) ) {
			allCheckboxes.prop( 'checked', true );
		} else {
			allCheckboxes.prop( 'checked', false );
		}
	} );

	$( "#dataSongTable" ).find( "thead" ).find( "tr" )
		.append( $('<th>').text( "dataInfo" ) )
//		.append( $('<th>').addClass("primaryColor").text( "Play" ) )
		.append( $('<th>').addClass("primaryColor").append( selectAllCheckbox ) )
		.append( $('<th>').addClass("primaryColor").text( "Type" ) )
		.append( $('<th>').addClass("primaryColor").text( "Duration" ) )
		.append( $('<th>').addClass("primaryColor").text( "Title Or File" ) )
		.append( $('<th>').addClass("primaryColor").text( "Title" ) )
		.append( $('<th>').addClass("primaryColor").text( "Artist" ) )
		.append( $('<th>').addClass("primaryColor").text( "Album" ) )
		.append( $('<th>').addClass("primaryColor").text( "Tempo" ) )
		.append( $('<th>').addClass("primaryColor").text( "Genre" ) )
		.append( $('<th>').addClass("primaryColor").text( "File path" ) )
		.append( $('<th>').addClass("primaryColor").text( "Modified" ) )
		.append( $('<th>').addClass("primaryColor").text( "Size" ) )
		.append( $('<th>').addClass("primaryColor").text( "Song info" ) )
		.append( $('<th>').addClass("primaryColor").text( "File type" ) )
	;



	dataSongTable = $("#dataSongTable").DataTable({
		"fixedHeader": true,
		"paging": false,
		"createdRow": function( row, data, dataIndex ) {
			$(row).attr( "draggable", "true");
		},
		"columnDefs": [
			{
				"targets": [ 0 ],
				"visible": false,
				//"searchable": false
			}, {
				"targets": 1,
				"data": null,
				"className": "preventSongLoad secondaryColor",
				"orderable": false,
				"defaultContent": '<div class="checkbox preventSongLoad"><label><input type="checkbox" value=""><span class="cr"><i class="cr-icon fa fa-check"></i></span></label></div>'
			},
			{
				"targets": [ "_all" ],
				"className": "secondaryColor",
			}
		]
	} )
	.on( 'dragstart', 'tr', function( event ) { //function dragSongToSonglist(event){
		if( event.dataTransfer === undefined ) {
			event.dataTransfer = event.originalEvent.dataTransfer;
		}
		var jsonDataInfo = dataSongTable.row( $(this) ).data()[0];

	  event.dataTransfer.setData("jsonDataInfo", jsonDataInfo);
	})
	.on( 'click', 'tr', function ( event ) {
		if( $( event.target ).closest( "td, th" ) .hasClass( "preventSongLoad" ) ) {
			return;
		}

		var dataInfo = JSON.parse(dataSongTable.row( $(this) ).data()[0]);

		$("#dataSongTable").find(".selected").removeClass("selected");
		$(this).addClass("selected");

		setSong(
			dataInfo.fullPath,
			dataInfo.galleryId
		);
	} );

																	/*
																	//något att titta på: ???????? slim sim :)  (för att ordna kolumnerna :) (fixa DB sparning, o interface...x ) )
																	var table = $('#table').DataTable({ colReorder: true });
																	$('button#newOrder').click(function() {
																	    table.colReorder.order([3,4,2,0,1], true);
																	});
																	*/

	//to make header primaryColor:
	$( "#dataSongTable thead th" ).removeClass( "secondaryColor" );

	// to move the searchbar away from the scrolling-area


	$( "#dataSongTable_filter" ).detach().prependTo( $( "#newSearchParent" ) );
	$( "#dataSongTable_filter" ).find( "input" )
		.attr("placeholder", "Search (Ctrl + F)" )
		.addClass("form-control-sm")
		.detach().prependTo( $( "#dataSongTable_filter" ) );
	$( "#dataSongTable_filter" ).find( "label" ).remove();

	if( $( "#toggleSonglistsId" ).hasClass( "active" ) ) {
		$( "#buttAttachedSongListToggle" ).addClass( "active" );
	}


	// Options for the observer (which mutations to observe)
	const songListsObserverConfig = {
	  attributes: true,
	  childList: false,
	  subtree: false
	};

	// Callback function to execute when mutations are observed
	var songListsObserverCallback = function(mutationsList, observer) {
		for (var mutation of mutationsList) {
			if( mutation.attributeName === "class" ) {
				var classList = mutation.target.className;
				if( $( mutation.target ).hasClass( "active" ) ) {
					$( "#buttAttachedSongListToggle" ).addClass( "active" );
				} else {
					$( "#buttAttachedSongListToggle" ).removeClass( "active" );
				}
				return;
			}
		}
	};

	// Create an observer instance linked to the callback function
	var songListsObserver = new MutationObserver(songListsObserverCallback);
	// Start observing the target node for configured mutations
	songListsObserver.observe( $( "#toggleSonglistsId" )[0], songListsObserverConfig);
}

function onChangeSongListSelector( event ) {
	console.log ( "onChangeSongListSelector -> ");

	var $target = $( event.target ),
		$selected = $target.find(":selected")
		$checkboxes = $( "#dataSongTable" ).find( "td" ).find( "input[type=checkbox]:checked" ),
		checkedVissibleSongs = $checkboxes.closest("tr").map( function(i, v){
			return JSON.parse( $('#dataSongTable').DataTable().row( v ).data()[0] );
		});

		
//		$( "#dataSongTable" ).find( "input[type=checkbox]:checked" );

	console.log ( "$target ", $target);
	console.log ( "$selected ", $selected);
	console.log ( "$parent ", $selected.parent());
	console.log ( "$id ", $selected.parent().attr( "id" ));



	/*
	$( "#dataSongTable" ).find( "input[type=checkbox]:checked" ).closest("tr").each( function(i, v){
		console.log( $('#dataSongTable').DataTable().row( v ).data()[0] )
	});
	*/

	var $songlist = $("#songListList").find( '[data-songlist-id="'+$selected.val()+'"]' );

	if( $selected.parent().attr( "id" ) == "songListSelectorAddToSonglist" ) {
		addSongsToSonglist( checkedVissibleSongs, $songlist );
	} else if(  $selected.parent().attr( "id" ) == "songListSelectorRemoveFromSonglist" ){
		console.log("should remove " + checkedVissibleSongs + " to data-songlist-id=" + $selected.val());
		removeSongsFromSonglist( checkedVissibleSongs, $songlist );
	} else {
		console.log("something wrong");
	}

	$target.val( 0 );
	$checkboxes.prop("checked", false).prop( "checked", false );

}

function dropSongOnSonglist( event ) {
	event.preventDefault();

	if( event.dataTransfer === undefined ) {
		event.dataTransfer = event.originalEvent.dataTransfer;
	}

	var dataInfo = JSON.parse( event.dataTransfer.getData("jsonDataInfo") ),
		$target = $(event.target);

	addSongsToSonglist( [dataInfo], $target );
}

function removeSongsFromSonglist( songs, $target ) {
	console.log("target", $target);
	var	i, 
		songDidNotExists,
		songList = $target.data("songList");

	$.each( songs, function(i, dataInfo) {
		songDidNotExists = true;
		songList.songs.forEach( function( v, i ) {
			if( v.galleryId == dataInfo.galleryId && v.fullPath == dataInfo.fullPath) {
				songDidNotExists = false;
				songList.songs.splice(i, 1);
			}
		} );

		if( songDidNotExists ) {
			$.notify( "This song did not exist in " + songList.name, "info" );
			return;
		}

		$target.data("songList", songList);

		notifyUndo( "The song was removed from " + songList.name, function(){
			var i,
				undo_songList = $target.data("songList");

			undo_songList.songs.push( dataInfo );

			DB.saveSonglists_new();
		} );
	});
	DB.saveSonglists_new();
}

function addSongsToSonglist( songs, $target ) {
	console.log("target", $target);
	var	songAlreadyExists,
		songList = $target.data("songList");

	$.each( songs, function(i, dataInfo) {
		songAlreadyExists = songList.songs.filter(function(value, index, arr){
			return value.galleryId == dataInfo.galleryId &&
				value.fullPath == dataInfo.fullPath;
		} ).length > 0;

		if( songAlreadyExists ) {
			$.notify( "This song is already in " + songList.name, "info" );
			return;
		}


		songList.isDirectory = false;
		songList.songs.push( dataInfo );

		$target.data("songList", songList);

		notifyUndo( "The song was added to " + songList.name, function(){
			var i,
				undo_songList = $target.data("songList");

			undo_songList.songs = undo_songList.songs.filter(function(value, index, arr){
				return !(value.galleryId == dataInfo.galleryId &&
					value.fullPath == dataInfo.fullPath);
			});

			DB.saveSonglists_new();
		} );
	});
	DB.saveSonglists_new();
}

function allowDrop( ev ) {
  ev.preventDefault();
}


function clickAttachedSongListToggle( event ) {
	$("#toggleSonglistsId").trigger( "click" );
}

function reloadSongsButtonActive( event ) {
	if( event == null || !$(event.target).hasClass( "outerDialog" ) ) {
		return
	}

	if( $( "#outerSongListPopUpSquare" ).hasClass( "hidden" ) ) {
		$( "#buttSongsDialog" ).removeClass( "active" );
	} else {
		$( "#buttSongsDialog" ).addClass( "active" );
	}
}

function closeSongDialog ( event ) {
	$( "#outerSongListPopUpSquare" ).addClass( "hidden" );
	$( "#songPickerAttachedArea" ).addClass( "hidden" );
	$( "#buttSongsDialog" ).removeClass( "active" );
};

function openSongDialog( event ) {
	if( $("#TROFF_SETTING_SONG_LIST_FLOATING_DIALOG" ).hasClass( "active" ) ) {
		$( "#outerSongListPopUpSquare" ).removeClass( "hidden" );
	} else {
		$( "#songPickerAttachedArea" ).removeClass( "hidden" );
	}
	$( "#buttSongsDialog" ).addClass( "active" );
}


function clickSongsDialog( event ) {
	if( $( event.target ).hasClass( "active" ) ) {
		closeSongDialog();
	} else {
		openSongDialog();
	}
}

function minimizeSongPicker(){
	closeSongDialog();
	$( "#TROFF_SETTING_SONG_LIST_FLOATING_DIALOG" ).click();
	openSongDialog();
}

function maximizeSongPicker(){
	closeSongDialog();
	$( "#TROFF_SETTING_SONG_LIST_FLOATING_DIALOG" ).click();
	openSongDialog();
}

function clickToggleFloatingSonglists( event ) {
	if( $( "#TROFF_SETTING_SONG_LIST_FLOATING_DIALOG" ).hasClass( "active" ) ) {
		//Note: the class will be removed by another eventlistener soon.
		moveSongPickerToAttachedState();
	} else {
		moveSongPickerToFloatingState();
	}
}

function moveSongPickerToAttachedState() {
	dataTableShowOnlyColumnsForAttachedState();
	$("#newSearchParent, #songPicker").detach().appendTo( $("#songPickerAttachedArea") );
	$( ".hideOnSongsDalogFloatingState" ).removeClass( "hidden" );
	$( ".hideOnSongsDalogAttachedState" ).addClass( "hidden" );
};

function moveSongPickerToFloatingState() {
	$("#newSearchParent, #songPicker").detach().insertBefore( "#buttCloseSongsPopUpSquare" );
	dataTableShowColumnsForFloatingState();
	$( "#songPickerAttachedArea, .hideOnSongsDalogFloatingState" ).addClass( "hidden" );
	$( ".hideOnSongsDalogAttachedState" ).removeClass( "hidden" );
};

function dataTableColumnPicker( event ) {
	var $target = $(event.target);
	// Get the column API object
	var column = $('#dataSongTable').DataTable().column( $(this).data('column') );

	$target.toggleClass( "active" );

	var columnVisibilityArray = $("#columnToggleParent").children().map(function(i, v){
		return $(v).hasClass("active");
	}).get();

	DB.saveVal( TROFF_SETTING_SONG_COLUMN_TOGGLE, columnVisibilityArray );

	// Toggle the visibility
	column.visible( ! column.visible() );

}


function dataTableShowOnlyColumnsForAttachedState() {
	$( "#columnToggleParent" ).children().each( function( i, v ) {
		if( $(v).data( "show-on-attached-state" ) ) {
			$('#dataSongTable').DataTable().column( $(v).data( "column" ) ).visible( true );
		} else {
			$('#dataSongTable').DataTable().column( $(v).data( "column" ) ).visible( false );
		}
	} );
}

function dataTableShowColumnsForFloatingState() {
	$( "#columnToggleParent" ).children().each( function( i, v ) {
		if( $( v ).hasClass( "active" ) ) {
			$('#dataSongTable').DataTable().column( $(v).data( "column" ) ).visible( true );
		} else {
			$('#dataSongTable').DataTable().column( $(v).data( "column" ) ).visible( false );
		}
	} );
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
			Troff.recallCurrentStateOfSonglists();

			clearInterval(Troff.stopTimeout);
		}, 100);
		return;
	}
	for (var i = 0; i < entries.length; i++) {
		if (entries[i].isFile) {
			addItem(entries[i]);
			addItem_NEW( entries[i] );
			gGalleryData[gGalleryIndex].numFiles++;
			loopFunktion(entries, gGalleryData[gGalleryIndex], i);
		}
		else if (entries[i].isDirectory) {
			gDirectories.push(entries[i]);
			addDirectory_NEW( entries[i] );
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
	 addGallery_New(mData.name, mData.galleryId);
	 gGalleryData[gGalleryIndex] = new GalleryData(mData.galleryId);
	 gGalleryReader = fs.root.createReader();
	 gGalleryReader.readEntries(scanGallery, errorPrintFactory('readEntries'));
}

function getGalleriesInfo(results) {
//	Media.getGalleriesInfo( results );
	clearList();
	clearGalleryAndDirectoryList()
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





/*
var Media = {};

Media.gGalleryArray;

Meida.getGalleriesInfo = function(results){
	Media.gGalleryArray = results;

	for( var i = 0; i < results.length; i++ ) {
		Media.scanGalleries( Media.gGalleryArray[i] );
	}
}
Media.scanGalleries = function() {
	 var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);

	 gCurOptGrp = Media.addGallery(mData.name, mData.galleryId);
	 Media.addGallery(mData.name, mData.galleryId);
	 gGalleryData[gGalleryIndex] = new GalleryData(mData.galleryId);
	 gGalleryReader = fs.root.createReader();
	 gGalleryReader.readEntries(scanGallery, errorPrintFactory('readEntries'));
}
Media.AddGallery(name, id) {
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
*/









var TroffClass = function(){
		var strCurrentSong = "";
		var iCurrentGalleryId = 0;
		var startTime = 0; // unused?
		var previousTime = 0; // unused?
		var time = 0; // unused?
		var nrTapps = 0;
		var m_zoomStartTime = 0;
		var m_zoomEndTime = null;

	this.recallFloatingDialog = function() {
		DB.getVal( "TROFF_SETTING_SONG_LIST_FLOATING_DIALOG", function( floatingDialog ){
			if( floatingDialog ) {
				moveSongPickerToFloatingState();
			} else {
				moveSongPickerToAttachedState();
			}
		});
	}

	this.recallSongColumnToggle = function( callback ) {
		DB.getVal( TROFF_SETTING_SONG_COLUMN_TOGGLE, function( columnToggle ){
			if( columnToggle === undefined ) {
				setTimeout(function() {
					Troff.recallSongColumnToggle();
				}, 42);
				return;
			}
			$( "#columnToggleParent" ).children().each( function( i, v ) {
				if( columnToggle[i] ) {
					$(v).addClass( "active" );
				} else {
					var column = $('#dataSongTable').DataTable().column( $(v).data('column') );
					column.visible( false );
				}
			} );
			callback();
		} );
	}

	this.toggleExtendedMarkerColor = function( event ) {
		if( $( "#markerList").hasClass( "extended-color" ) ) {
			$( "#markerList").removeClass( "extended-color" );
			$( "#toggleExtendedMarkerColor").removeClass( "active" );
			DB.saveVal( TROFF_SETTING_EXTENDED_MARKER_COLOR, false );
		} else {
			$( "#markerList").addClass( "extended-color" );
			$( "#toggleExtendedMarkerColor").addClass( "active" );
			DB.saveVal( TROFF_SETTING_EXTENDED_MARKER_COLOR, true );
		}
	};
	
	this.recallExtendedMarkerColor = function() {
		DB.getVal( TROFF_SETTING_EXTENDED_MARKER_COLOR, function( extend ) {
			if( extend ) {
				$( "#markerList").addClass( "extended-color" );
				$( "#toggleExtendedMarkerColor").addClass( "active" );
			}
		} );
	};

	this.toggleExtraExtendedMarkerColor = function( event ) {
		if( $( "#markerList").hasClass( "extra-extended" ) ) {
			$( "#markerList").removeClass( "extra-extended" );
			$( "#toggleExtraExtendedMarkerColor").removeClass( "active" );
			DB.saveVal( TROFF_SETTING_EXTRA_EXTENDED_MARKER_COLOR, false );
		} else {
			$( "#markerList").addClass( "extra-extended" );
			$( "#toggleExtraExtendedMarkerColor").addClass( "active" );
			DB.saveVal( TROFF_SETTING_EXTRA_EXTENDED_MARKER_COLOR, true );
		}
	};
	
	this.recallExtraExtendedMarkerColor = function() {
		DB.getVal( TROFF_SETTING_EXTRA_EXTENDED_MARKER_COLOR, function( extend ) {
			if( extend ) {
				$( "#markerList").addClass( "extra-extended" );
				$( "#toggleExtraExtendedMarkerColor").addClass( "active" );
			}
		} );
	};


	this.setTheme = function( event ) {
		var $target = $( event.target ),
			theme = $target.data( "theme" );
		$target.closest("#themePickerParent").find( ".selected" ).removeClass( "selected" );
		$target.addClass( "selected" );
		$( "#colorScheme" ).attr( "href", "stylesheets/" + theme + ".css" );


//slim sim here

// testa att använda chrome.runtime.getManifest().short_name 
// för att kolla test eller prod :)

/*
		var o = {};
		o[ TROFF_SETTING_SET_THEME ] = theme;
		chrome.storage.local.set( o );
		*/
		DB.saveVal( TROFF_SETTING_SET_THEME, theme);

		
	};

/*
	this.setButtonActiveValue = function( event ) {
		var $target = $( event.target ),
			id = $target.attr( "id" ),
			idToShow = $target.data( "id-to-show" );

		$target.toggleClass( "active" );


		if( idToShow ) {
			if( $target.hasClass( "active" ) ){
				$( "#" + idToShow ).removeClass( "hidden" );
			} else {
				$( "#" + idToShow ).addClass( "hidden" );
			}
		}

		DB.saveVal( id, $target.hasClass( "active" ) );
	}
	*/
	

	
	this.recallGlobalSettings = function(){
		Troff.recallTheme();
		Troff.recallExtendedMarkerColor();
		Troff.recallExtraExtendedMarkerColor();
		Troff.recallSongColumnToggle( function(){
			Troff.recallFloatingDialog();
		});
		/*
		Troff.recallButtonActiveValue(TROFF_SETTING_ENTER_GO_TO_MARKER_BEHAVIOUR);
		Troff.recallButtonActiveValue(TROFF_SETTING_ENTER_USE_TIMER_BEHAVIOUR);
		Troff.recallButtonActiveValue(TROFF_SETTING_SPACE_GO_TO_MARKER_BEHAVIOUR);
		Troff.recallButtonActiveValue(TROFF_SETTING_SPACE_USE_TIMER_BEHAVIOUR);
		Troff.recallButtonActiveValue(TROFF_SETTING_PLAY_UI_BUTTON_GO_TO_MARKER_BEHAVIOUR);
		Troff.recallButtonActiveValue(TROFF_SETTING_PLAY_UI_BUTTON_USE_TIMER_BEHAVIOUR);
		Troff.recallButtonActiveValue(TROFF_SETTING_ON_SELECT_MARKER_GO_TO_MARKER);
		Troff.recallButtonActiveValue(TROFF_SETTING_CONFIRM_DELETE_MARKER);
		Troff.recallButtonActiveValue(TROFF_SETTING_ENTER_RESET_COUNTER);
		Troff.recallButtonActiveValue(TROFF_SETTING_SPACE_RESET_COUNTER);
		Troff.recallButtonActiveValue(TROFF_SETTING_PLAY_UI_BUTTON_RESET_COUNTER);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_ARTIST_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_TITLE_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_ALBUM_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_PATH_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_PLAY_FULL_SONG_BUTTONS_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_ZOOM_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_UI_LOOP_BUTTONS_SHOW);
		Troff.reacllUiValueShow(TROFF_SETTING_PLAY_UI_BUTTON_SHOW_BUTTON);
		*/
	};

	this.reacllUiValueShow = function( databaseKey ) {
		DB.getVal( databaseKey, function( value ) {
			if( value === undefined ) {
				return;
			}
			var $button = $( "#" + databaseKey ),
				idToShow = $("#" + databaseKey ).data( "id-to-show" );
			if( value ) {
				$button.addClass( "active" );
				$("#" + idToShow ).removeClass("hidden");
			} else {
				$button.removeClass( "active" );
				$("#" + idToShow ).addClass("hidden");
			}
		} );
	}

	this.recallTheme = function() {
		DB.getVal( TROFF_SETTING_SET_THEME, function( theme ) {
			theme = theme || "col1";
			$( "#themePickerParent" )
				.find( "[data-theme=\"" + theme + "\"]" )
				.addClass( "selected" );
			$( "#colorScheme" ).attr( "href", "stylesheets/" + theme + ".css" );
		} );
	};

	this.recallButtonActiveValue = function(databaseKey) {// detta är det jag håller på med nu :)
		DB.getVal( databaseKey, function( goToMarker ) {
			if( goToMarker === undefined ) {
				return;
			}
			var $button = $( "#" + databaseKey );
			if( goToMarker ) {
				$button.addClass( "active" );
			} else {
				$button.removeClass( "active" );
			}
		} );
	};
	
	
	this.closeSettingsDialog = function( event ) {
		$( "#outerSettingPopUpSquare" ).addClass( "hidden" );
	};
	this.openSettingsDialog = function( event ) {
		$( "#outerSettingPopUpSquare" ).removeClass( "hidden" );
	};

	//Public variables:
	this.dontShowZoomInstructions = false;

	this.firstTimeUser = function(){
		$('#firstTimeUserDialog').removeClass( "hidden" );
	};
	
	this.firstTimeUserDialogTour = function(){
		$('#firstTimeUserDialog').addClass("hidden");
		IO.openHelpWindow();
	};

	this.firstTimeUserDialogOK = function(){
		$('#firstTimeUserDialog').addClass( "hidden");
	};

	// this is regarding the "play in fullscreen" - button
	this.setPlayInFullscreen = function(bPlayInFullscreen){
		if(bPlayInFullscreen){
			$("#playInFullscreenButt").addClass("active");
		} else {
			$("#playInFullscreenButt").removeClass("active");
		}
	};

	this.setMirrorImage = function(bMirrorImage){
		if(bMirrorImage){
			$("#mirrorImageButt").addClass("active");
			$("#videoBox").addClass( "flip-horizontal" );
		} else {
			$("#mirrorImageButt").removeClass("active");
			$("#videoBox").removeClass( "flip-horizontal" );
		}
	};

	// this is regarding the "play in fullscreen" - button
	this.playInFullscreenChanged = function(){
		var butt = document.querySelector('#playInFullscreenButt');
		butt.classList.toggle("active");

		var bFullScreen = butt.classList.contains('active');
		DB.setCurrent(strCurrentSong, 'bPlayInFullscreen', bFullScreen );

		document.getElementById('blur-hack').focus();
	};

	this.mirrorImageChanged = function( event ) {
		var bMirrorImage = !$(event.target).hasClass( "active" );
		DB.setCurrent(strCurrentSong, 'bMirrorImage', bMirrorImage );
		Troff.setMirrorImage( bMirrorImage );

		document.getElementById('blur-hack').focus();
	}

	this.setImageLayout = function(){
		$( ".hideOnPicture" ).addClass( "hidden" );
	};
	this.setAudioVideoLayout = function(){
		$( ".hideOnPicture" ).removeClass( "hidden" );
	};


	// this is regarding the f-key, IE- the actual fullscreen
	this.forceFullscreenChange = function(){
		var videoBox = document.querySelector('#videoBox');
		if(!videoBox) return;
//		var infoSection = document.querySelector('#infoSection');
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

	this.setMedatadaImage = function( media ) {
		DB.getImageMetaDataOf(Troff.getCurrentSong());
	}

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
		var goToMarker = $("#" + TROFF_SETTING_ON_SELECT_MARKER_GO_TO_MARKER ).hasClass( "active" );
		if( $('audio, video')[0].paused && goToMarker )
			Troff.goToStartMarker();
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

		if( $('audio, video').length === 0 ) {
			return 0;
		}

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
		var goToMarker = $("#" + TROFF_SETTING_ENTER_GO_TO_MARKER_BEHAVIOUR ).hasClass( "active" ),
			updateLoopTimes = $("#" + TROFF_SETTING_ENTER_RESET_COUNTER ).hasClass( "active" ),
			useTimer = $("#" + TROFF_SETTING_ENTER_USE_TIMER_BEHAVIOUR ).hasClass( "active" );
		Troff.spaceOrEnter( goToMarker, useTimer, updateLoopTimes );
	};// end enterKnappen

	this.space = function(){
		var goToMarker = $("#" + TROFF_SETTING_SPACE_GO_TO_MARKER_BEHAVIOUR ).hasClass( "active" ),
			updateLoopTimes = $("#" + TROFF_SETTING_SPACE_RESET_COUNTER ).hasClass( "active" ),
			useTimer = $("#" + TROFF_SETTING_SPACE_USE_TIMER_BEHAVIOUR ).hasClass( "active" );
		Troff.spaceOrEnter( goToMarker, useTimer, updateLoopTimes );
	}; // end space()
	
	this.playUiButton = function() {
		var goToMarker = $("#" + TROFF_SETTING_PLAY_UI_BUTTON_GO_TO_MARKER_BEHAVIOUR ).hasClass( "active" ),
			updateLoopTimes = $("#" + TROFF_SETTING_PLAY_UI_BUTTON_RESET_COUNTER ).hasClass( "active" ),
			useTimer = $("#" + TROFF_SETTING_PLAY_UI_BUTTON_USE_TIMER_BEHAVIOUR ).hasClass( "active" );
		Troff.spaceOrEnter( goToMarker, useTimer, updateLoopTimes );
	}

	this.spaceOrEnter = function( goToMarker, useTimer, updateLoopTimes ) {
		var audio = document.querySelector("audio, video");
		if(!audio){
				console.error("no song loaded");
				return;
		}

		if( goToMarker ) {
			Troff.goToStartMarker();
		} 
		if( Troff.getMood() == 'pause' ) {
				if( useTimer && $('#buttPauseBefStart').hasClass('active') ) {
					Troff.playSong( $('#pauseBeforeStart').val() * 1000 );
				} else {
					Troff.playSong();
				}
		} else {
				Troff.pauseSong(updateLoopTimes);
		}
		document.getElementById('blur-hack').focus();
	}; // end spaceOrEnter()

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

	this.pauseSong = function( updateLoopTimes ){
		updateLoopTimes = updateLoopTimes!==undefined?updateLoopTimes:true;
		var audio = document.querySelector('audio, video');
		if (audio)
				audio.pause();
		Troff.setMood('pause');
		if( updateLoopTimes ) {
			Troff.updateLoopTimes();
		}

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
			$('#buttPlayUiButtonPlay').removeClass("hidden");
			$('#buttPlayUiButtonPause').addClass("hidden");
		}
		if(mood == 'wait'){
			$('#infoSection, .moodColorizedText').removeClass('play pause').addClass('wait');
			if(document.querySelector('#playInFullscreenButt.active')){
				document.querySelector('#videoBox').classList.add('fullscreen');
				document.querySelector('#infoSection').classList.add('overFilm');
			}
			$('#buttPlayUiButtonPlay').addClass("hidden");
			$('#buttPlayUiButtonPause').removeClass("hidden");
		}
		if(mood == 'play'){
			$('#infoSection, .moodColorizedText').removeClass('wait pause').addClass('play');
			if(document.querySelector('#playInFullscreenButt.active')){
				document.querySelector('#videoBox').classList.add('fullscreen');
				document.querySelector('#infoSection').classList.remove('overFilm');
			}
			$('#buttPlayUiButtonPause').removeClass("hidden");
			$('#buttPlayUiButtonPlay').addClass("hidden");
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
		Troff.setAreas([false, false, false, false]);
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
	
	/*Troff*/this.getCurrentMarkers = function(bGetStopMarkers){
		if(bGetStopMarkers){
			return $('#markerList li input:nth-child(4)');
		}
		return $('#markerList li input:nth-child(3)');
	};

	/*
		exportStuff, gets current song markers to the clippboard
	*/
	/*Troff*/this.exportStuff = function(){
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
	/*Troff*/this.importStuff = function(){
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

				DB.saveMarkers( Troff.getCurrentSong(), function() {
					DB.saveStates( Troff.getCurrentSong(), function() {
						Troff.updateSongInfo();
					} );
				} );

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
			}
			function importSonginfo(strSongInfo){
				$('#songInfoArea').val($('#songInfoArea').val() + strSongInfo);
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
//        DB.saveStates(Troff.getCurrentSong()); -- xxx
			}
		});
	};

	/*
		createMarker, all, tar reda pÃ¥ tiden o namnet,
		anropar sedan add- och save- Marker
	 */
	/*Troff*/this.createMarker = function(){
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

	/*Troff*/this.toggleImportExport = function(){
		IO.jQueryToggle( '#outerImportExportPopUpSquare');
		//$('#outerImportExportPopUpSquare').toggle();
		document.getElementById('blur-hack').focus();
	};

	/*Troff*/this.toggleInfoAndroid = function(){
		IO.jQueryToggle('#outerInfoAndroidPopUpSquare');
		document.getElementById('blur-hack').focus();
	};
	
	
	/*Troff*/this.getLastSlashName = function(strUrl){
		var aUrl = strUrl.split("/");
		return aUrl[aUrl.length-1];
	};
	
	/*Troff*/this.addSpacesBetweenSlash = function(strUrl){
		return strUrl.replace(/\//g, " / ");
	};


	/*Troff*/this.toggleArea = function(event) {
		document.getElementById('blur-hack').focus();

		var sectionToHide = $( event.target ).attr( "section-to-hide" );

		if( sectionToHide ) {
			event.target.classList.toggle('active');
			$( sectionToHide ).toggle();
			DB.setCurrentAreas(Troff.getCurrentSong());
		}
	};
	
	this.setAreas = function(abAreas) {
		$('#statesTab').toggleClass("active", abAreas[0]);
		$('#stateSection').toggle(abAreas[0]);
		$('#settingsTab').toggleClass("active", abAreas[1]);
		$('#timeSection').toggle(abAreas[1]);
		$('#infoTab').toggleClass("active", abAreas[2]);
		$('#userNoteSection').toggle(abAreas[2]);
		$('#countTab').toggleClass("active", abAreas[3]);
		$('#infoSection').toggle(abAreas[3]);
	};
	
	this.setInfo = function(info){
		$('#songInfoArea').val(info);
	};
	
	this.setSonglists = function(aoSonglists){
		for(var i=0; i<aoSonglists.length; i++){
			Troff.addSonglistToHTML(aoSonglists[i]);
		}
	};

	this.setSonglists_NEW = function( aoSonglists ) {
		for(var i=0; i<aoSonglists.length; i++){
			Troff.addSonglistToHTML_NEW(aoSonglists[i]);
		}
	};

	this.addSonglistToHTML_NEW = function( oSongList ) {
		$( "#songListList" )
			.append(
				$("<ul>")
					.addClass("py-1")
					.append( $( "<button>" )
						.addClass("stOnOffButton")
						.data("songList", oSongList)
						.attr("data-songlist-id", oSongList.id)
						.text( oSongList.name )
						.click(clickSongList_NEW)
					)
					.on( "drop", dropSongOnSonglist)
					.on( "dragover", allowDrop)
			);
//			var o = $('<option value="Option Value2">Option Name2</option>');
//		$("#songListSelector").append( o );
//		$("#songListSelector").append( $('<option>').attr('value', "Option Value")
//				.appent("Option Name");

		var oAdd = $("<option>")
			.text("Add to " + oSongList.name)
			.val(oSongList.id);
		$("#songListSelectorAddToSonglist").append( oAdd );
		var oRemove = $("<option>")
			.text("Remove from " + oSongList.name)
			.val(oSongList.id);
		$("#songListSelectorRemoveFromSonglist").append( oRemove );

	};

	this.recallCurrentStateOfSonglists = function() {
		DB.getVal( "TROFF_SETTING_SONG_LIST_ADDITIVE_SELECT", function( isAdditiveSelect ) {
			DB.getVal( TROFF_CURRENT_STATE_OF_SONG_LISTS, function( o ) {

				var indicatorClass = isAdditiveSelect ? "active" : "selected";

				$("#songListAll_NEW").removeClass( "selected" );

				o.directoryList.forEach(function(v, i){
					$("#directoryList").find("[data-gallery-id="+v.galleryId+"]").each(function( inner_index, inner_value){
						if( $(inner_value).data("full-path") == v.fullPath ) {
							$(inner_value).addClass( indicatorClass );
							$("#songListAll_NEW").removeClass( "selected" );
						}
					});
				});
				o.galleryList.forEach(function(v, i){
					$("#galleryList").find("[data-gallery-id="+v+"]").addClass( indicatorClass );
					$("#songListAll_NEW").removeClass( "selected" );
				});
				o.songListList.forEach(function(v, i){
					$("#songListList").find("[data-songlist-id="+v+"]").addClass( indicatorClass );
					$("#songListAll_NEW").removeClass( "selected" );
				});

				filterSongTable( getFilterDataList() );
			});
		});

	};

	this.saveCurrentStateOfSonglists = function() {
		var o = {},
			songListList = [],
			galleryList = [],
			directoryList = [];
		$("#songListList").find( ".active, .selected" ).each(function(i, v){
			songListList.push( $(v).attr("data-songlist-id") );
		} );
		o.songListList = songListList;

		$("#galleryList").find( ".active, .selected" ).each(function(i, v){
			galleryList.push( $(v).attr("data-gallery-id") );
		} );
		o.galleryList = galleryList;

		$("#directoryList").find( ".active, .selected" ).each(function(i, v){
			directoryList.push( {
				galleryId : $(v).attr("data-gallery-id"),
				fullPath : $(v).attr( "data-full-path" )
			} );
		} );
		o.directoryList = directoryList;

		DB.saveVal( TROFF_CURRENT_STATE_OF_SONG_LISTS, o );
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
		$( "#searchCreateSongList" ).val( "" ).trigger( "click" );
		IO.clearEnterFunction();
		$('#songListPartButtons, #songListPartTheLists').show();
		Troff.resetNewSongListPartAllSongs();
	};
	
	this.removeSonglist = function(){
		IO.confirm( 'Remove songlist?',
								'Don you want to permanently remove this songlist?',
								function(){
			$('#newSongListPart').hide();
			$( "#searchCreateSongList" ).val( "" ).trigger( "click" );
			IO.clearEnterFunction();
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
		$( "#searchCreateSongList" ).val( "" ).trigger( "click" );
		IO.clearEnterFunction();


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
		var buttE = $('<button>')
			.attr('type', 'button')
			.addClass('small')
			.addClass('regularButton')
			.click(Troff.editSonglist)
			.append(
				$( "<i>" )
				.addClass( "fa")
				.addClass( "fa-pencil-alt")
			);

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

/*
	this.setSonglistById_NEW = function(id){
		if(id === 0){
			$("#songListAll_NEW").click();
			return;
		}
		$( "#songListList" ).find( "input[data-songlist-id=" + id  + "]" ).click();
	}
	*/
	this.selectSong = function(){
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
	
	this.editCurrentSongInfo = function() {
		if( $("#songInfoArea").hasClass( "hidden" ) ) return;
		var quickTimeOut = setTimeout(function(){
			$( "#songInfoArea" ).click();
			$( "#songInfoArea" ).focus();
		}, 0);
	}

	this.editCurrentMarkerInfo = function(){
		if( $("#markerInfoArea").hasClass( "hidden" ) ) return;
		var quickTimeOut = setTimeout(function(){
			document.getElementById("markerInfoArea").click();
			document.getElementById("markerInfoArea").focus();
			clearInterval(quickTimeOut);
		}, 0);
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
	};

	this.updateSongInfo = function(){
		var strInfo = $('#songInfoArea')[0].value;
		var songId = Troff.getCurrentSong();
		DB.setCurrentSongInfo(strInfo, songId);
	};
	
	this.rememberCurrentState = function(){
		if( $("#statesTab").hasClass( "hidden" ) ) return;

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


	this.searchCreateSongList = function( event ) {
		Troff.searchSongTot(
			event,
			"#newSongListPartAllSongs",
			function( el ){ return el.attr( "isDirectory" ) == "false"; },
			function( el ){ return el.find( "div" ).text(); }
		);
	};

	this.searchSongTot = function( event, selector, test, getText ) {
		function normalizeText( text ) {
			return text
				.toLowerCase()
				.replace(/[åä]/g, "a")
				.replace(/[öø]/g, "o")
				.replace(/[\W_]/g, "");
		}
		var addedSelected = false;
		$( selector ).children().each(function( i, element ){
			var el = $( element );
			if( test( el ) ) {
				if( normalizeText( getText( el ) ).includes( normalizeText( $( event.target ).val() ) ) ){
					el.removeClass( "hidden" );
				} else {
					el.addClass( "hidden" );
				}
			}
		} );
	};

	this.searchSong = function( event ) {
		Troff.searchSongTot(
			event,
			"#gallery",
			function( el ){ return el.is( "button" ); },
			function( el ){ return el.text(); }
		);

		var importantEl = $('#gallery .important');
		if( importantEl.length === 0 || importantEl.hasClass('hidden') ){
			importantEl.removeClass('important');
			$('#gallery :visible:button').eq(0).addClass('important');
		}
	};

	this.enterSerachDataTableSongList = function( event ) {
		$input = $( event.target );
		$input.addClass('textareaEdit');

		if( !$input.is(':focus') ) {
			$input.focus();
		}

		IO.setEnterFunction(function(event){
			/*
			if(event.ctrlKey==1){//Ctrl+Enter will exit
				$input.val('').trigger('click');
				document.getElementById('blur-hack').focus();
				return false;
			}
			*/
			return true;
		});

	};
	this.exitSerachDataTableSongList = function( event ) {
		IO.clearEnterFunction();
		document.getElementById('blur-hack').focus();
	};
	
	this.enterSearchCreateSongList = function( event ){

		$input = $( event.target );
		$input.addClass('textareaEdit');

		if( !$input.is(':focus') ) {
			$input.focus();
		}
		Troff.searchCreateSongList( event );

		IO.setEnterFunction(function(event){
			if(event.ctrlKey==1){//Ctrl+Enter will exit
				$('#searchCreateSongList').val('').trigger('click');
				document.getElementById('blur-hack').focus();
				return false;
			}
			return true;
		});

	};
	
	this.enterSearch = function( event ){
		if( $('#songsArea').is(':hidden') ) {
			$('#songsTab').trigger('click');
		}
		$input = $( event.target );
		$input.addClass('textareaEdit');
		Troff.searchSong( event );
		
		IO.setEnterFunction(function(event){
			if(event.ctrlKey==1){//Ctrl+Enter will exit
				$('#searchSong').val('').trigger('click');
				document.getElementById('blur-hack').focus();
				return false;
			}
			
			$('#gallery .important').trigger('click');
			$('#searchSong').val('').trigger('click');
			return true;
		}, function(event){
			var next,
					element = $('#gallery .important');

			if( event.keyCode == 37 || event.keyCode == 39 ) return;
			event.preventDefault();
			
			if(event.keyCode == 40) {
				next = element.nextUntil(null,"button:not(.hidden)").eq(0);
			} else {
				next = element.prevUntil(null,"button:not(.hidden)").eq(0);
			}

			if( next.length ) {
				element.removeClass('important');
				next.addClass('important');
			}
		});
	};
	this.exitSearchCreateSongList = function( event ){
		Troff.exitSearchTot( event, "#newSongListPartAllSongs .important" );
	};
	this.exitSearch = function( event ){
		Troff.exitSearchTot( event, "#gallery .important" );
	};

	this.exitSearchTot = function( event, selector ) {
		$( event.target ).removeClass('textareaEdit');
		$( selector ).removeClass('important');
		IO.clearEnterFunction();
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
	};
	
	this.enterEditText = function( event ) {
		$input = $( event.target );
		
		$input.addClass('textareaEdit');
		IO.setEnterFunction(function(event){
			if(event.ctrlKey==1){//Ctrl+Enter will exit
				document.getElementById('blur-hack').focus();
				return false;
			}
			return true;
		});
	};

	this.exitEditText = function( event ){
		$( event.target ).removeClass('textareaEdit');
		IO.clearEnterFunction();
	};

		this.updateMarkerInfo = function(){
			var strInfo = $('#markerInfoArea')[0].value;
			var color = $('.currentMarker')[0].color;
			var markerId = $('.currentMarker').attr('id');
			var time = $('.currentMarker')[0].timeValue;
			var markerName = $('.currentMarker').val();
			var songId = Troff.getCurrentSong();
			
			$('.currentMarker')[0].info = strInfo;
			
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
				var time = Number(oMarker.time);
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

				var buttonE = $( "<button>" )
					.addClass( "small" )
					.addClass( "regularButton" )
					.attr( "id", nameId + 'E')
					.append(
						$( "<i>" )
						.addClass( "fa")
						.addClass( "fa-pencil-alt")
					);

				var p = document.createElement("b");
				p.innerHTML = Troff.secToDisp(time);

				var docMarkerList = document.getElementById('markerList');
				var listElement = document.createElement("li");

				listElement.appendChild( buttonE[0] );
				listElement.appendChild(p);
				listElement.appendChild(button);
				listElement.appendChild(buttonS);
				$( listElement ).addClass( MARKER_COLOR_PREFIX + color );


				var child = $('#markerList li:first-child')[0];
				var bInserted = false;
				var bContinue = false;
				while(child) {
					var childTime = parseFloat(child.childNodes[2].timeValue);
					if(childTime !== undefined && Math.abs(time - childTime) < 0.001){
						var markerId = child.childNodes[2].id;
						
						if(child.childNodes[2].info != info){
							updated = true;
							var newMarkerInfo = child.childNodes[2].info + "\n\n" + info;
							$('#'+markerId)[0].info = newMarkerInfo;
							if($('.currentMarker')[0].id == child.childNodes[2].id)
								$('#markerInfoArea').val(newMarkerInfo);
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
			Troff.fixMarkerExtraExtendedColor();
		}; // end addMarker ****************/


		/*
		 * returns the id of the earlyest and latest markers.
		 * (note: latest marker without the 'S' for stop-id)
		 */
		this.getFirstAndLastMarkers = function(){
			var aOMarkers = $('#markerList > li > :nth-child(3)');
			if(aOMarkers.length == 0 ) {
				return null;
			}
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
			
			if( $("#" + TROFF_SETTING_ON_SELECT_MARKER_GO_TO_MARKER ).hasClass( "active" ) ) {
				Troff.goToStartMarker();
			}
			
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


		this.toggleMoveMarkersMoreInfo = function(){
			//$('#moveMarkersMoreInfoDialog').toggle();
			IO.jQueryToggle( "#moveMarkersMoreInfoDialog" );
			document.getElementById('blur-hack').focus();
		};

		/*
			show the move markers pop up dialog. 
		*/
		this.showMoveMarkers = function(){
			IO.setEnterFunction(function(){
				Troff.moveMarkers();
			});
			$('#moveMarkersDialog').removeClass( "hidden" );
			$('#moveMarkersNumber').select();
		};

		/*
			hide the move markers pop up dialog. 
		*/
		this.hideMoveMarkers = function(){
			$('#moveMarkersDialog').addClass( "hidden" );
			$('#moveMarkersMoreInfoDialog').addClass( "hidden" );
			//$('#moveMarkersMoreInfoDialog').hide();
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
			$('#moveMarkersDialog').addClass( "hidden" );
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
					if(Number(aAllMarkers[j].timeValue) == newTime){
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
			var oldMarkerClass = MARKER_COLOR_PREFIX + oldMarkerColor;

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
				$('#'+markerId).parent().removeClass( oldMarkerClass );
				$('#'+markerId).parent().addClass( MARKER_COLOR_PREFIX + newMarkerColor );
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
				Troff.fixMarkerExtraExtendedColor();
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
						var audioVideo =  document.querySelector('audio, video');
						if( audioVideo == null ) {
							console.error("there is no audio or video tag");
							return;
						}
						var songTime = audioVideo.duration;
						var markerTime = Number(child.childNodes[2].timeValue);
						var myRowHeight = child.clientHeight;

						var freeDistanceToTop = timeBarHeight * markerTime / songTime;

						var marginTop = freeDistanceToTop - totalDistanceTop + barMarginTop;
						totalDistanceTop = freeDistanceToTop + myRowHeight + barMarginTop;

						if( marginTop > 0 ){
							$( child ).css( "border-top-width", marginTop + "px" );
							$( child ).css( "border-top-style", "solid" );
							$( child ).css( "margin-top", "" );
						} else {
							$( child ).css( "border-top-width", "" );
							$( child ).css( "border-top-style", "" );
							$( child ).css( "margin-top", marginTop + "px" );
						}
						child = child.nextSibling;
				}
				Troff.settAppropriateActivePlayRegion();
		}; // end settAppropriateMarkerDistance
		
		this.selectNext = function(reverse){
			var markers = $('#markerList').children();
			
			var currentMarkerTime = Number($('.currentMarker')[0].timeValue, 10);
			var currentStopTime = Number($('.currentStopMarker')[0].timeValue, 10);
			markers.sort(function(a, b){
				return Number(a.childNodes[2].timeValue) - Number(b.childNodes[2].timeValue);
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
				if(Number(markers[i].childNodes[3].timeValue) == currentStopTime){
					bSelectNextStop = true;
				}
				if(bSelectNext){
					$(markers[i].childNodes[2]).click();
					bSelectNext = false;
				}
				if(Number(markers[i].childNodes[2].timeValue) == currentMarkerTime){
					bSelectNext = true;
				}
			}
		};

		
		this.zoomDontShowAgain = function(){
			$('#zoomInstructionDialog').addClass( "hidden" );
			Troff.dontShowZoomInstructions = true;
			DB.setZoomDontShowAgain();
			IO.clearEnterFunction();
		};
		
		this.zoomDialogOK = function(){
			$('#zoomInstructionDialog').addClass( "hidden" );
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
					$('#zoomInstructionDialog').removeClass( "hidden" );
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




		this.fixMarkerExtraExtendedColor = function() {
			$( "#markerList" ).children().removeClassStartingWith("extend_");

			$( "#markerList" ).children( ":not(.markerColorNone)" ).each( function( index ) {
				specialColorClass = Troff.getClassStartsWith( $(this).attr('class'), "markerColor");
				$( this ).nextUntil( ":not(.markerColorNone)" ).addClass("extend_" + specialColorClass);
			} );

		}


		/* standAlone Functions */
		this.getClassStartsWith = function(classes,startString){
			var r = $.grep(classes.split(" "),
				function(classes,r) {
					return 0 === classes.indexOf(startString);
				}).join();
			return r || !1;
		}

		this.secToDisp = function(seconds){
				var sec = ( seconds | 0 ) % 60;
				if ( sec < 10 )
						sec = "0"+sec;
				var min = (seconds / 60) | 0;
				return min + ':' + sec;
		};

		this.milisToDisp = function( milis ) {
			var date = new Date( milis );

			var d = date.getDate();
			var m = date.getMonth() + 1;

			var dd = d < 10 ? "0"+d : d;
			var mm = m < 10 ? "0"+m : m;
			var year = "" + date.getFullYear();

			return year + "-" +  mm + "-" + dd;
		}

		this.byteToDisp= function( byte ) {
			var nrTimes = 0;
				units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

			while( byte >= 1000 ) {
				nrTimes++;
				byte = byte / 1000;
				if(nrTimes > units.length)
					return byte;
			}

			return Math.round( byte * 10 ) / 10 + units[nrTimes];
		}

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

			while( aLastMonthUsage.length > 100 ) {
				aLastMonthUsage.shift();
			}

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
			$('#rateDialog').removeClass( "hidden" );
		}
	};
	
	this.rateDialogNoThanks = function(){
		document.getElementById('blur-hack').focus();
		IO.clearEnterFunction();
		$('#rateDialog').addClass( "hidden" );
		chrome.storage.sync.set({'iRatedStatus' : Rate.RATED_STATUS_NO_THANKS});
	};
	this.rateDialogAskLater = function(){
		document.getElementById('blur-hack').focus();
		IO.clearEnterFunction();
		$('#rateDialog').addClass("hidden");
		chrome.storage.sync.set({'iRatedStatus' : Rate.RATED_STATUS_ASK_LATER});
	};
	this.rateDialogRateNow = function(){
		document.getElementById('blur-hack').focus();
		IO.clearEnterFunction();
		$('#rateDialog').addClass("hidden");
		chrome.storage.sync.set({'iRatedStatus' : Rate.RATED_STATUS_ALREADY_RATED});
		
		var strChromeWebStore = 'https://chrome.google.com/webstore/detail/';
		var strTroffName = 'troff-training-with-music/';
		var strTroffIdReview = 'mebbbmcjdgoipnkpmfjndbolgdnakppl/reviews';
		window.open(strChromeWebStore + strTroffName + strTroffIdReview);
	};
}; //End RateClass



var DBClass = function(){
	
	this.saveVal = function( key, value) {
		var o = {};
		o[ key ] = value;
		chrome.storage.local.set( o );
	};

	this.getVal = function( key, returnFunction ) {
		chrome.storage.local.get( key, function( item ) {
			returnFunction( item[ key ] );
		} );
	};
	
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
		
		songObject = DB.fixSongObject(songObject);
		
		var obj = {};
		obj[songId] = songObject;
		chrome.storage.local.set(obj);
	}; // end cleanSong
	
	this.fixSongObject = function(songObject){

		if (songObject === undefined) songObject = {};
		
		if(songObject.hasOwnProperty('iWaitBetweenLoops')){
			songObject.wait = songObject.iWaitBetweenLoops;
			delete songObject.iWaitBetweenLoops;
		} 
	
		var songLength;
		try{
			songLength = Number(document.getElementById('timeBar').max);
		} catch (e) {
			console.error("getElementById('timeBar') does not exist."
				+ " Tryed to call fixSongObject without it....");
			songLength = "max";
		}

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


		/* Slim sim remove 
		 * remove the zoomEndTime == 42, I will continue on null instead.....
		 * This is only for fixing the zoom to 42 second-bug introduced sometime 
		 * and fixed for version 1.01?
		 */

		if(!songObject.zoomEndTime || songObject.zoomEndTime == 42) songObject.zoomEndTime = null;
		
		if(!songObject.markers) songObject.markers = [oMarkerStart, oMarkerEnd];
		if(!songObject.abAreas) 
			songObject.abAreas = [false, true, true, true];
		if(!songObject.currentStartMarker) 
			songObject.currentStartMarker = oMarkerStart.id;
		if(!songObject.currentStopMarker)
			songObject.currentStopMarker = (oMarkerEnd.id + 'S');


		return songObject;
	};
	
	/*DB*/this.fixDefaultValue = function( allKeys, key, valIsTrue ) {
		if(allKeys.indexOf( key ) === -1 ) {
			var obj = {};
			obj[ key ] = valIsTrue;
			chrome.storage.local.set( obj );

			if( valIsTrue ) {
				$("#" + key ).addClass("active");
			} else {
				$("#" + key ).removeClass("active");
			}
		}
	}

	/*DB*/this.cleanDB = function(){
		chrome.storage.local.get(null, function(items) {
			var allKeys = Object.keys(items);
			if(allKeys.length === 0){ // This is the first time Troff is started:
				DB.saveSonglists();
				DB.setCurrentSonglist(0);
			}
			// These is fore the first time Troff is started:
			if(allKeys.indexOf("straoSongLists")   === -1 ) DB.saveSonglists();
			if(allKeys.indexOf("iCurrentSonglist") === -1 ) DB.setCurrentSonglist(0);
//      if(allKeys.indexOf("abCurrentAreas")   === -1 ) DB.setCurrentAreas(); //depricated
			if(allKeys.indexOf("zoomDontShowAgain")=== -1 ) {
				chrome.storage.local.set({"zoomDontShowAgain" : false});
			}

			if( allKeys.indexOf("abGeneralAreas") === -1 ) {
				chrome.storage.local.set({"abGeneralAreas" : JSON.stringify([false, true])});
			}

			DB.fixDefaultValue( allKeys, TROFF_SETTING_SONG_COLUMN_TOGGLE, [
				$("#columnToggleParent" ).find( "[data-column=3]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=4]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=5]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=6]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=7]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=8]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=9]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=10]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=11]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=12]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=13]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=14]" ).data( "default" ),
				$("#columnToggleParent" ).find( "[data-column=15]" ).data( "default" ),
			] );



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



			var SETTING_KEYS = $("[data-st-save-value-key]").map(function(){return $(this).data("st-save-value-key");}).get();
			for(var key in items) {
				if( TROFF_SETTING_KEYS.indexOf( key ) != -1 || SETTING_KEYS.indexOf( key ) != -1 ) {
					continue;
				}

				DB.cleanSong(key, items[key]);
			}
		});//end get all keys
	};
	
	/*DB*/this.saveSonglists_new = function() {
		var i,
			aoSonglists = [],
			aDOMSonglist = $('#songListList').find('button');

		for( i=0; i<aDOMSonglist.length; i++ ){
			aoSonglists.push(aDOMSonglist.eq(i).data('songList'));
		}

		var straoSonglists = JSON.stringify(aoSonglists);
		chrome.storage.local.set({'straoSongLists': straoSonglists});
	}

	/*DB*/this.saveSonglists = function(){
		var aoSonglists = [];
		
		var aDOMSonglist = $('#songListPartTheLists li');
		for(var i=0; i<aDOMSonglist.length; i++){
			aoSonglists.push(JSON.parse(aDOMSonglist[i].getAttribute('stroSonglist')));
		}
		$('#songlistHelpText').toggle($('#songListPartTheLists >').length === 0);
		

		var straoSonglists = JSON.stringify(aoSonglists);
		chrome.storage.local.set({'straoSongLists': straoSonglists});
	};

	/*DB*/this.setCurrentAreas = function(songId){
		chrome.storage.local.get(songId, function(ret) {
			var song = ret[songId];
			if(!song){
				console.error('Error "setCurrentAreas, noSong" occurred, songId='
					+songId);
				return;
			}
			song.abAreas = [
				$('#statesTab').hasClass("active"),
				$('#settingsTab').hasClass("active"),
				$('#infoTab').hasClass("active"),
				$('#countTab').hasClass("active")
			];

			var obj = {};
			obj[songId] = song;
			chrome.storage.local.set(obj);
		});
	};
	
	/*DB*/this.setCurrentSonglist = function(iSonglistId){
		chrome.storage.local.set({'iCurrentSonglist': iSonglistId});
	};

	/*DB*/this.setCurrentSong = function(path, galleryId){
		var stroSong = JSON.stringify({"strPath":path, "iGalleryId": galleryId});
		chrome.storage.local.set({'stroCurrentSongPathAndGalleryId': stroSong});
	};
	
	/*DB*/this.setZoomDontShowAgain = function(){
		chrome.storage.local.set({"zoomDontShowAgain" : true});
	};
	
	/*DB*/this.getZoomDontShowAgain = function(){
		chrome.storage.local.get("zoomDontShowAgain", function(ret){
			var bZoomDontShowAgain = ret["zoomDontShowAgain"] || false;
			Troff.dontShowZoomInstructions = bZoomDontShowAgain;
		});
	};

	/*DB*/this.getAllSonglists = function(){
		chrome.storage.local.get('straoSongLists', function(ret){
			var straoSongLists = ret['straoSongLists'] || "[]";
			Troff.setSonglists(JSON.parse(straoSongLists));
			Troff.setSonglists_NEW(JSON.parse(straoSongLists));
		});
	};
	
	/*DB*/this.getCurrentSonglist = function(){
		chrome.storage.local.get('iCurrentSonglist', function(ret){
			Troff.setSonglistById(ret['iCurrentSonglist']);
		});
	};
	
	/*DB*/this.getCurrentSong = function(){
		chrome.storage.local.get('stroCurrentSongPathAndGalleryId', function(ret){
			var stroSong = ret['stroCurrentSongPathAndGalleryId'];
			if(!stroSong){
				Troff.setAreas([false, false, false, false]);
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

	/*DB*/this.updateMarker = function(markerId, newName, newInfo, newColor, newTime, songId){
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

	/*DB*/this.saveStates = function(songId, callback){
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
		if( callback ) {
			callback();
		}
	});
	};
	
	/*DB*/this.saveZoomTimes = function(songId, startTime, endTime) {
	chrome.storage.local.get(songId, function(ret){
		var song = ret[songId];
		if(!song){
			console.error('Error "saveZoomTimes, noSong" occurred, songId=' + songId);
			song = DB.getStandardSong();
		}
		
		song.zoomStartTime = startTime;
		song.zoomEndTime = endTime;

		/* Slim sim remove 
		 * This is only for fixing the zoom to 42 second-bug introduced sometime 
		 * and fixed for version 1.01?
		 */
		if(song.zoomEndTime == 42) song.zoomEndTime = 42.000000001;
		
		var obj = {};
		obj[songId] = song;
		chrome.storage.local.set(obj);
	});
	};

	/*DB*/this.saveMarkers = function(songId, callback) {
	chrome.storage.local.get(songId, function(ret){
		var aAllMarkers = Troff.getCurrentMarkers();

		var aMarkers = [];
		for(var i=0; i<aAllMarkers.length; i++){
			var oMarker = {};
			oMarker.name  = aAllMarkers[i].value;
			oMarker.time  = Number(aAllMarkers[i].timeValue);
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
		
		if( callback ) {
			callback();
		}
	});
	};// end saveMarkers


	// this has nothing to do with "State", it just updates the DB
	// with the songs current data
	/*DB*/this.saveSongDataFromState = function(songId, oState){
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
		
	/*DB*/this.setCurrentStartAndStopMarker = function(startMarkerId, stopMarkerId,
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



	/*DB*/this.setCurrentStartMarker = function(name, songId){
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
	this.setCurrentSongInfo = function(info, songId){
		DB.setCurrent(songId, 'info', info);
	};
	
	this.setCurrentTempo = function(tempo, songId){
		DB.setCurrent(songId, 'tempo', tempo);
	};

	/*DB*/this.setCurrent = function(songId, key, value){
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

	/*DB*/this.getMarkers = function(songId, funk) {
	chrome.storage.local.get(songId, function(ret){
		var song = ret[songId];
		if(!song || !song.markers ){ // new song or no markers
			return;
		}
		funk(song.markers);
	});
	};

	/*DB*/this.getSongMetaDataOf = function(songId) {
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
			if(song.bMirrorImage !== undefined)
				Troff.setMirrorImage(song.bMirrorImage);
			Troff.setWaitBetweenLoops(song.wait[0], song.wait[1]);
			
			Troff.setInfo(song.info);
			Troff.setTempo(song.tempo);
			Troff.addButtonsOfStates(song.aStates);
			Troff.setAreas(song.abAreas);

			Troff.setCurrentSong();
			
			Troff.zoom(song.zoomStartTime, song.zoomEndTime);

		};// end loadSongMetadata
		
		chrome.storage.local.get(songId, function(ret){

			var song = ret[songId];
			
			if(!song){ // new song:
				song = DB.fixSongObject();
				var obj = {};
				obj[songId] = song;
				chrome.storage.local.set(obj);
				
				loadSongMetadata(song, songId);
			} else {
				loadSongMetadata(song, songId);
			}
		});

	}; // end getSongMetadata

	/*DB*/this.getImageMetaDataOf = function(songId) {
		var loadImageMetadata = function(song, songId){
			Troff.setMood('pause');
			Troff.setInfo(song.info);
			Troff.setTempo(song.tempo);
			Troff.addButtonsOfStates(song.aStates);
			Troff.setAreas(song.abAreas);
			Troff.setCurrentSong();			
		};// end loadImageMetadata
		
		chrome.storage.local.get(songId, function(ret){

			var song = ret[songId];
			
			if(!song){ // new song:
				song = DB.fixSongObject();
				var obj = {};
				obj[songId] = song;
				chrome.storage.local.set(obj);
				
				loadImageMetadata(song, songId);
			} else {
				loadImageMetadata(song, songId);
			}
		});
	}; // end getSongMetadata
};// end DBClass






var IOClass = function(){

	/* this is used to know if button-presses should be in "pop-up"-mode
		or in regular mode */
	var IOEnterFunction = false;
	var IOArrowFunction = false;

	/*IO*/this.startFunc = function() {

		document.addEventListener('keydown', IO.keyboardKeydown);
		
		$( ".outerDialog" ).click( function( event ) {
			//if( $(event.delegateTarget).attr( "id") == $(event.target).attr( "id") ) {
			if( $(event.target ).hasClass( "outerDialog" ) ) {
				$( event.target ).addClass( "hidden" );
			}
		} );

		$( "#songListAll_NEW" ).click( clickSongList_NEW );
		$( "#songListSelector" ).change( onChangeSongListSelector );

		$( "#buttSettingsDialog" ).click ( Troff.openSettingsDialog );
		$( "#buttCloseSettingPopUpSquare" ).click ( Troff.closeSettingsDialog );

		//$( "#buttSongsDialog" ).click ( Troff.openSongDialog );
		$( "#buttSetSongsDalogToFloatingState" ).click( moveSongPickerToFloatingState )
		//$( "#buttCloseSongsPopUpSquare" ).click ( closeSongDialog );
		$( ".buttCloseSongsDialog" ).click( closeSongDialog );
		$( "#buttAttachedSongListToggle" ).click( clickAttachedSongListToggle );


		$( "#buttSongsDialog" ).click( clickSongsDialog );
		$( ".buttSetSongsDalogToAttachedState" ).click( minimizeSongPicker );
		$( ".buttSetSongsDalogToFloatingState" ).click( maximizeSongPicker );
		$( "#outerSongListPopUpSquare" ).click( reloadSongsButtonActive );

		$( "#TROFF_SETTING_SONG_LIST_FLOATING_DIALOG" ).click( clickToggleFloatingSonglists );

//		$( "#buttSetSongsDalogToFloatingState" ).click( clickSetSongsDalogToFloatingState );

		$( "#toggleExtendedMarkerColor" ).click ( Troff.toggleExtendedMarkerColor );
		$( "#toggleExtraExtendedMarkerColor" ).click ( Troff.toggleExtraExtendedMarkerColor );
		
		$( "#themePickerParent" ).find("input").click ( Troff.setTheme );
		$( "#columnToggleParent" ).find("input").click( dataTableColumnPicker );

		
		$('#buttPlayUiButtonParent').click( Troff.playUiButton );
		$('#buttTip').click(IO.openHelpWindow);

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
		$('#readMoreAndroidTroff').click(Troff.toggleInfoAndroid);
		$('#buttCancelInfoAndroidPopUpSquare').click(Troff.toggleInfoAndroid);
		$('#buttExportMarker').click(Troff.exportStuff);
		$('#buttImportMarker').click(Troff.importStuff);
		$('#buttPauseBefStart').click(Troff.togglePauseBefStart);
		$('#buttStartBefore').click(Troff.toggleStartBefore);
		// Don't update as the user is typing:
		//$('#startBefore').change(Troff.updateStartBefore);
		$('#startBefore')[0].addEventListener('input', Troff.updateStartBefore);
		$('#searchSong')[0].addEventListener('input', Troff.searchSong);
		$('#searchCreateSongList')[0].addEventListener('input', Troff.searchCreateSongList);
		
		$('#buttZoom').click(Troff.zoomToMarker);
		$('#buttZoomOut').click(Troff.zoomOut);
		
		$('#areaSelector >').click(Troff.toggleArea);

		$('#markerInfoArea').change(Troff.updateMarkerInfo);
		$('#markerInfoArea').blur(Troff.exitMarkerInfo);
		$('#markerInfoArea').click(Troff.enterMarkerInfo);
		$( '#searchCreateSongList' ).click( Troff.enterSearchCreateSongList );
		$( '#searchCreateSongList' ).blur( Troff.exitSearchCreateSongList );
		$(" [type=\"search\"] " ).click( Troff.enterSerachDataTableSongList );
		$(" [type=\"search\"] " ).blur( Troff.exitSerachDataTableSongList );

		$('.editText').click(Troff.enterSearch);
		$('.editText').blur(Troff.exitSearch);



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
		
		$('#infoAndroidDonate').click(function() {
			$('#donate').click();
		});

		$('#donate').click(function(){
			IO.alert("Waiting for Google Wallet");
			document.getElementById('blur-hack').focus();
		});
		$('.loopButt').click( Troff.setLoop );
		
		
		window.addEventListener('resize', function(){
			Troff.settAppropriateMarkerDistance();
		});
		
		Troff.recallGlobalSettings();

	};//end startFunc


	/*IO*/this.jQueryToggle = function( idString ){
		if( $(idString).hasClass("hidden") ) {
			$(idString).removeClass("hidden");
		} else {
			$(idString).addClass("hidden");
		}
	}

	/*IO*/this.setColor = function( colClass ) {
		$('html').removeClass();
		$('html').addClass( colClass );
	};

	/*IO*/this.keyboardKeydown  = function(event) {
		if(IOEnterFunction){
			if(event.keyCode == 13){
				IOEnterFunction(event);
			}
			if( IOArrowFunction ) {
				if( [37, 38, 39, 40].indexOf(event.keyCode) != -1 ) {
					IOArrowFunction(event);
				}
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
		case 73: // I
			Troff.editCurrentSongInfo();
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
			if(event.ctrlKey==1){
				
				$('#searchSong').trigger('click').select();
			}
			else
				Troff.forceFullscreenChange();
			break;
		case 71: // G
			Troff.goToStartMarker();
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

	/*IO*/this.setEnterFunction = function(func, arrowFunc){
		IOEnterFunction = func;
		if( arrowFunc !== undefined ) IOArrowFunction = arrowFunc;
		else IOArrowFunction = false;
	};
	
	/*IO*/this.clearEnterFunction = function(){
		IOEnterFunction = false;
		IOArrowFunction = false;
	};

	/*IO*/this.promptEditMarker = function(markerId, func, funcCancle){
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


		IOEnterFunction = function() {
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

			var confirmDelete = $( "#" + TROFF_SETTING_CONFIRM_DELETE_MARKER ).hasClass( "active" );
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

			if( markerId ) {
				if( confirmDelete ) {
					IO.confirm( "Remove marker", "Are you sure?", function() {
						Troff.removeMarker( markerId );
					} );
				} else {
					Troff.removeMarker( markerId );
				}
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
	
	initSongTable();

	DB.cleanDB();
	DB.getAllSonglists();
	DB.getZoomDontShowAgain();
//	DB.getGeneralAreas();
	IO.startFunc();
	//FS.startFunc();
	FSstartFunc();
	Rate.startFunc();
	DB.getCurrentSong();

});

 $.fn.removeClassStartingWith = function (filter) {
	$(this).removeClass(function (index, className) {
		return (className.match(new RegExp("\\S*" + filter + "\\S*", 'g')) || []).join(' ')
	});
	return this;
};