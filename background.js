var transactions = {};
var staticOrigin = false;

function arm() {
  browser.webRequest.onBeforeSendHeaders.addListener(reqHandler,{urls: ["<all_urls>"]},["blocking" ,"requestHeaders"]);
  browser.webRequest.onHeadersReceived.addListener(resHandler,{urls: ["<all_urls>"]},["blocking" ,"responseHeaders"]);
}

function disarm(){
  browser.webRequest.onBeforeSendHeaders.removeListener(reqHandler);
  browser.webRequest.onHeadersReceived.removeListener(resHandler);
}

function reqHandler(request) {
        // prepare transaction, store transaction request
        let transaction = {
             request         : request
            ,requestHeaders  : {}
            ,response        : {}
            ,responseHeaders : {}
        };

        // shorthand access to request headers
        for(let header of request.requestHeaders) {
            transaction.requestHeaders[header.name.toLowerCase()] = header;
        }

        // store transaction
        transactions[request.requestId] = transaction;

        // force origin based on prefs
        if(staticOrigin) {
            transaction.requestHeaders['origin'].value = staticOrigin;
        }

        // apply modifications
        return {
            requestHeaders : transaction.request.requestHeaders
        };
    }


    /***************************************************************************
    responseHandler
    ***/
function resHandler(response) {
    // get transaction
    // console.log(response.requestId);
    // console.log(transactions);
    let transaction = transactions[response.requestId];

    // store transaction response
    transaction.response = response;

    // shorthand access to response headers
    for(let header of response.responseHeaders) {
        transaction.responseHeaders[header.name.toLowerCase()] = header;
    }

    // create response headers if necessary
    for(let name of [
         'access-control-allow-origin'
        ,'access-control-allow-methods'
        ,'access-control-allow-headers'
        ,'access-control-allow-credentials'
    ]) {
        // header exists, skip
        if(transaction.responseHeaders[name]) {
            continue;
        }

        // create header
        let header = {
             name  : name
            ,value : "null"
        };

        // update response
        transaction.response.responseHeaders.push(header)

        // update shorthand
        transaction.responseHeaders[name] = header;
    }

    // set "access-control-allow-origin", prioritize "origin" else "*"
    transaction.responseHeaders['access-control-allow-origin'].value =
        transaction.requestHeaders['origin']
        && transaction.requestHeaders['origin'].value !== null
            ? transaction.requestHeaders['origin'].value
            : '*';

    // set "access-control-allow-methods"
    if(
        transaction.requestHeaders['access-control-request-method']
        && transaction.requestHeaders['access-control-request-method'].value !== null
    ) {
        transaction.responseHeaders['access-control-allow-methods'].value =
            transaction.requestHeaders['access-control-request-method'].value
    }

    // set "access-control-allow-headers"
    if(
        transaction.requestHeaders['access-control-request-headers']
        && transaction.requestHeaders['access-control-request-headers'].value !== null
    ) {
        transaction.responseHeaders['access-control-allow-headers'].value =
            transaction.requestHeaders['access-control-request-headers'].value
    }

    // set "access-control-allow-credentials"
    transaction.responseHeaders['access-control-allow-credentials'].value = "true";

    // delete transaction
    delete transactions[response.requestId];

    // apply modifications
    return {
        responseHeaders: transaction.response.responseHeaders
        ,statusCode : 777
    };
}


browser.runtime.onMessage.addListener(trigger);

function trigger(message) {
  if (message == "arm") {
    arm();
  }
  else {
    disarm();
  }
}
