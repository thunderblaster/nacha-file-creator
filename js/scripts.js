// IE polyfills
if (!String.prototype.repeat) {
	String.prototype.repeat = function(count) {
	  'use strict';
	  if (this == null) {
		throw new TypeError('can\'t convert ' + this + ' to object');
	  }
	  var str = '' + this;
	  count = +count;
	  if (count != count) {
		count = 0;
	  }
	  if (count < 0) {
		throw new RangeError('repeat count must be non-negative');
	  }
	  if (count == Infinity) {
		throw new RangeError('repeat count must be less than infinity');
	  }
	  count = Math.floor(count);
	  if (str.length == 0 || count == 0) {
		return '';
	  }
	  // Ensuring count is a 31-bit integer allows us to heavily optimize the
	  // main part. But anyway, most current (August 2014) browsers can't handle
	  // strings 1 << 28 chars or longer, so:
	  if (str.length * count >= 1 << 28) {
		throw new RangeError('repeat count must not overflow maximum string size');
	  }
	  var maxCount = str.length * count;
	  count = Math.floor(Math.log(count) / Math.log(2));
	  while (count) {
		 str += str;
		 count--;
	  }
	  str += str.substring(0, maxCount - str.length);
	  return str;
	}
  }
// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}
// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0,targetLength);
        }
    };
}
// /IE Polyfills

$(function () {
    $('[data-toggle="popover"]').popover()
})

function download(filename, text) {
    if(window.navigator.msSaveOrOpenBlob) {
		var blob = new Blob([text], {type: 'text/plain'});
        window.navigator.msSaveBlob(blob, filename);
	} else {
		var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
	}

  }
