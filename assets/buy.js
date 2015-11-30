(function() { var f=this,g=function(a,d){var c=a.split("."),b=window||f;c[0]in b||!b.execScript||b.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===d?b=b[e]?b[e]:b[e]={}:b[e]=d};var h=function(a){var d=chrome.runtime.connect("nmmhkkegccagdldgiimedpiccmgmieda",{}),c=!1;d.onMessage.addListener(function(b){c=!0;"response"in b&&!("errorType"in b.response)?a.success&&a.success(b):a.failure&&a.failure(b)});d.onDisconnect.addListener(function(){!c&&a.failure&&a.failure({request:{},response:{errorType:"INTERNAL_SERVER_ERROR"}})});d.postMessage(a)};g("google.payments.inapp.buy",function(a){a.method="buy";h(a)});
g("google.payments.inapp.getPurchases",function(a){a.method="getPurchases";h(a)});g("google.payments.inapp.getSkuDetails",function(a){a.method="getSkuDetails";h(a)}); })();

/*
This file is part of Troff.

Troff is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Troff is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Troff.  If not, see <http://www.gnu.org/licenses/>.
*/

window.onload = function(){

purchaseSuccess = function(e){
  IO.alert("Thank you!");
}

purchaseFail = function(e){
//  IO.alert("Thanks for the consideration!");
}



purchase = function(){

  var onSkuDetails = function(response){
    $('#donateList').empty();
    var products = response.response.details.inAppProducts;
    var count = products.length;
    for (var i = 0; i < count; i++) {
      var product = products[i];
      addProductToUI(product);
    }
    $('.outerDialog').hide();
    document.querySelector('#donateDialog').style.display="";
  }


  function addProductToUI(product) {
    var row = $("<tr></tr>");

    var colDesc = $("<td></td>").text(product.localeData[0].description);
    var price = parseInt(product.prices[0].valueMicros, 10) / 1000000;
    var currency = product.prices[0].currencyCode;
    console.log("currency", currency);
    var colPrice = $("<td></td>").text(price + currency);
//var tittle = product.localeData[0].title    
    var val = "Donate " + price + " " + currency;

    var butAct = $("<input value='" + val +
                "' type='button' class='rowBreak regularButton'></input>")
      .data("sku", product.sku)
      .attr("id", "prodButPrefix" + product.sku)
      .click(onActionButton);
/*    var colBut = $("<td></td>").append(butAct);
    row
      .append(colDesc)
      .append(colPrice)
      .append(colBut);
    $("tbody").append(row);
*/    
    $("#donateList").append(butAct);

  }
  var onActionButton = function(evt) {
    var actionButton = $(evt.currentTarget);
    if (actionButton.data("license")) {
      showLicense(actionButton.data("license"));
    } else {
      var sku = actionButton.data("sku");
      buyProduct(sku);
    }
  }

  var buyProduct = function(sku) {
    google.payments.inapp.buy({
      parameters: {'env': "prod"},
      'sku': sku,
      'success': purchaseSuccess,
      'failure': purchaseFail
    });
  }

  var onSkuDetailsFail = function(a){
    $('.outerDialog').hide();
    IO.alert("Sorry, can not reach Google-wallet at the moment. "+
              "This feature requires a connection to the internet.")
              
//    closeDonateDialog();
//    return;  /*

    $('#donateList').empty();
    var product = {}
    product.localeData = [];
    product.localeData[0] = {};
    product.localeData[0].title = "Donate little"
    product.localeData[0].description = "You like Troff and want to show it. That is very apreasiated!"
    product.prices = []
    product.prices[0] = {};
    product.prices[0].valueMicros = 990000;
    product.prices[0].currencyCode = "USD";
    product.sku = "petra_suport_0";

    console.log("products:")
    console.log(product);
    addProductToUI(product);


    var product2 = {}
    product2.localeData = [];
    product2.localeData[0] = {};
    product2.localeData[0].title = "Vote for phone app"
    product2.localeData[0].description = "Vote for this feature if you think that Troff should also exist as a phone app!"
    product2.prices = []
    product2.prices[0] = {};
    product2.prices[0].valueMicros = 1990000;
    product2.prices[0].currencyCode = "USD";
    product2.sku = "petra_suport_1";

    addProductToUI(product2);
    addProductToUI(product2);
    addProductToUI(product2);
    addProductToUI(product2);
    addProductToUI(product2);
//    addProductToUI(product2);
//    addProductToUI(product2);
//    addProductToUI(product2);
//    addProductToUI(product2);

    document.querySelector('#donateDialog').style.display="";
    // */
  }

  google.payments.inapp.getSkuDetails({
    'parameters': {'env': 'prod'},
    'success': onSkuDetails,
    'failure': onSkuDetailsFail
  });

}

closeDonateDialog = function(){
  document.querySelector('#donateDialog').style.display="none";
  $("tbody tr").remove();
}


document.getElementById('donate').addEventListener('click', purchase);
document.getElementById('closeDonateDialog').addEventListener('click', closeDonateDialog);


}//end window.onload
