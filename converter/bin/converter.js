'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = process.argv.slice(2); /**
                                   * Converts the lists from ./sources
                                   * 
                                   * List Credits:
                                   * ./sources/mimes.txt - http://svn.apache.org/viewvc/httpd/httpd/branches/2.2.x/docs/conf/mime.types?revision=1750837&view=co
                                   * ./sorces/signatures.dat - http://www.garykessler.net/library/file_sigs.html
                                   */

console.log('Running converter with arguments', args);

// I have encoded these files to utf8 from ANSI
var sigFile = _fs2.default.readFileSync('./sources/signatures.dat', 'utf8'),
    mimeFile = _fs2.default.readFileSync('./sources/mimes.txt', 'utf8');

var sigContents = sigFile.split('\n'),
    mimeContents = mimeFile.split('\n').slice(1);

// Process signatures content into a more usable form
var data = [],
    mimeData = [];

sigContents.forEach(function (line, ind) {
	var parts = line.split(',');

	// Some entries in the list do not contain an extension, so I'm excluding them
	if (parts.length === 3 && parts[2] !== '(none)') {
		(function () {
			var ext = parts[2].toLowerCase().trim(),
			    byteSig = parts[1].split(' ').map(function (b) {
				return parseInt(b, 16);
			}); //Signatures are in hex, convert to dec

			var processExt = function processExt(extension, byteSignature) {
				var found = false;
				data.forEach(function (ent, sind) {
					//Searching for existing extension entry
					if (ent.extension === extension) {
						if (Array.isArray(ent.signature[0])) ent.signature.push(byteSignature);else ent.signature = [ent.signature, byteSignature];

						found = true;
					}
				});

				if (!found) {
					data.push({
						extension: extension,
						signature: byteSignature
					});
				}
			};

			//Some extensions have multiples, so we break them down
			if (ext.indexOf('|')) {
				var exts = ext.split('|');
				exts.forEach(function (e) {
					return processExt(e, byteSig);
				});
			} else processExt(ext, byteSig);
		})();
	} else console.log('Warn: Invalid line ' + ind);
});

mimeContents.forEach(function (line) {
	if (line.startsWith('#')) return;
	line = line.replace(/\s+/g, ' '); //Stupid file is space indented

	var parts = line.split(' ');
	if (parts.length >= 2) {
		(function () {
			var mime = parts[0].toLowerCase().trim(),
			    exts = parts.slice(1, parts.length - 1);

			mimeData.push({
				mime: mime, extensions: exts
			});

			exts.forEach(function (ext) {
				ext = ext.toLowerCase().trim();

				var found = false;
				data.forEach(function (ent, dind) {
					if (ent.extension === ext) {
						data[dind].mime = mime;
						found = true;
					}
				});
				if (!found) console.log('Warn: No extension available for mime', ext, mime);
			});
		})();
	}
});

//////////////////////////////////////////////////////////////////
// Clean the results based on duplicates and needing ALL values //
//////////////////////////////////////////////////////////////////

function arrayEquals(arrA, arrB) {
	var equals = true;

	arrA.forEach(function (a, i) {
		if (!equals) return;

		if (i >= arrB.length || arrB[i] !== a) equals = false;
	});

	return equals;
}

var cleaned = [];
data.forEach(function (ent, ind) {
	if (!ent.mime) return;

	var found = false;
	cleaned.forEach(function (cent, ind) {
		if (cent.mime === ent.mime) {
			//Combine extension first
			if (Array.isArray(cent.extension)) cent.extension.push(ent.extension);else cent.extension = [cent.extension, ent.extension];

			//Next figure out byte signatures
			if (Array.isArray(ent.signature[0])) {
				//Are we an array of arrays?
				ent.signature.forEach(function (sig) {
					var eSigMatch = false;
					if (Array.isArray(cent.signature[0])) {
						cent.signature.forEach(function (csig) {
							if (arrayEquals(sig, csig)) eSigMatch = true;
						});
					} else {
						if (arrayEquals(sig, cent.signature)) eSigMatch = true;
					}

					if (!eSigMatch) {
						if (Array.isArray(cent.signature[0])) cent.signature.push(sig);else cent.signature = [cent.signature, sig];
					}
				});
			} else {
				var eSigMatch = false;
				if (Array.isArray(cent.signature[0])) {
					cent.signature.forEach(function (csig) {
						if (arrayEquals(ent.signature, csig)) eSigMatch = true;
					});
				} else {
					if (arrayEquals(ent.signature, cent.signature)) eSigMatch = true;
				}

				if (!eSigMatch) {
					if (Array.isArray(cent.signature[0])) cent.signature.push(ent.signature);else cent.signature = [cent.signature, ent.signature];
				}
			}

			found = true;
		}
	});

	if (!found) {
		cleaned.push({
			mime: ent.mime,
			extension: ent.extension,
			signature: ent.signature
		});
	}
});

_fs2.default.writeFileSync('./output/complete.json', JSON.stringify(cleaned));
_fs2.default.writeFileSync('./output/mime-extensions.json', JSON.stringify(mimeData));

///////////////////////////////////////////
// Further Mime formats for dictionaries //
///////////////////////////////////////////
var mime2Ext = {},
    ext2Mime = {};

mimeData.forEach(function (dat) {
	if (!mime2Ext.hasOwnProperty(dat.mime)) mime2Ext[dat.mime] = dat.extensions[0];

	dat.extensions.forEach(function (ext) {
		if (!ext2Mime.hasOwnProperty(ext)) ext2Mime[ext] = dat.mime;
	});
});

_fs2.default.writeFileSync('./output/mime2ext.json', JSON.stringify(mime2Ext));
_fs2.default.writeFileSync('./output/ext2mime.json', JSON.stringify(ext2Mime));

////////////////////////////////////////
// Minify the complete and all others //
////////////////////////////////////////

var dataMin = [];

data.forEach(function (ent) {
	return dataMin.push({
		m: ent.mime,
		e: ent.extension,
		s: ent.signature
	});
});
_fs2.default.writeFileSync('./output/complete.min.json', JSON.stringify(dataMin));