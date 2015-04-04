// Use the runtime event listeners to set a window property indicating whether the
// app was launched normally or as a result of being restarted

chrome.app.runtime.onLaunched.addListener(function(data) {
  chrome.app.window.create(
    'page.html',
    {bounds: {width:900, height:600}, minWidth:470, minHeight:370,  id:"TroffWin"}
  );
});
