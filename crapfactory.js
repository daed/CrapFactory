
console.log("crapfactory active!");


randomWord = "spoon"; // for small values of random
goog = "https://www.google.com/search?q=" + randomWord;

function crap(url) {
  browser.runtime.sendMessage("arm")
    .then(function () {
      fetch(url).then(function(response) {
          console.log(response);
          browser.runtime.sendMessage("disarm");
      });
  });
}

crap(goog);
