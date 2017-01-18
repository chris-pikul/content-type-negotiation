/**
 * Converts the lists from ./sources
 * 
 * List Credits:
 * ./sources/mimes.txt - http://svn.apache.org/viewvc/httpd/httpd/branches/2.2.x/docs/conf/mime.types?revision=1750837&view=co
 * ./sorces/signatures.dat - http://www.garykessler.net/library/file_sigs.html
 */
import Fs from 'fs'

const args = process.argv.slice(2)
console.log('Running converter with arguments', args)

// I have encoded these files to utf8 from ANSI
const sigFile = Fs.readFileSync('./sources/signatures.dat', 'utf8'),
	mimeFile = Fs.readFileSync('./sources/mimes.txt', 'utf8')

const sigContents = sigFile.split('\n'),
	mimeContents = mimeFile.split('\n').slice(1)

// Process signatures content into a more usable form
const data = [],
	mimeData = []

sigContents.forEach((line, ind) => {
	const parts = line.split(',')

	// Some entries in the list do not contain an extension, so I'm excluding them
	if(parts.length === 3 && parts[2] !== '(none)') {
		const ext = parts[2].toLowerCase().trim(),
			byteSig = parts[1].split(' ').map(b => parseInt(b, 16)) //Signatures are in hex, convert to dec

		const processExt = (extension, byteSignature) => {
			let found = false
			data.forEach((ent, sind) => {
				//Searching for existing extension entry
				if(ent.extension === extension) {
					if( Array.isArray(ent.signature[0]) )
						ent.signature.push(byteSignature)
					else
						ent.signature = [ent.signature, byteSignature]

					found = true
				}
			})

			if(!found) {
				data.push({
					extension: extension,
					signature: byteSignature
				})
			}
		}

		//Some extensions have multiples, so we break them down
		if(ext.indexOf('|')) {
			const exts = ext.split('|')
			exts.forEach(e => processExt(e, byteSig))
		} else
			processExt(ext, byteSig)
	} else
		console.log('Warn: Invalid line '+ind)
})

mimeContents.forEach(line => {
	if(line.startsWith('#'))
		return;
	line = line.replace(/\s+/g, ' ') //Stupid file is space indented

	const parts = line.split(' ')
	if(parts.length >= 2) {
		const mime = parts[0].toLowerCase().trim(),
			exts = parts.slice(1, parts.length - 1)

		mimeData.push({
			mime, extensions: exts
		})

		exts.forEach(ext => {
			ext = ext.toLowerCase().trim()

			let found = false
			data.forEach((ent, dind) => {
				if(ent.extension === ext) {
					data[dind].mime = mime
					found = true
				}
			})
			if(!found)
				console.log('Warn: No extension available for mime', ext, mime)
		})
	}
})

//////////////////////////////////////////////////////////////////
// Clean the results based on duplicates and needing ALL values //
//////////////////////////////////////////////////////////////////

function arrayEquals(arrA, arrB) {
	let equals = true

	arrA.forEach((a, i) => {
		if(!equals)
			return

		if(i >= arrB.length || arrB[i] !== a)
			equals = false
	})

	return equals
}

var cleaned = []
data.forEach((ent, ind) => {
	if(!ent.mime)
		return;

	let found = false
	cleaned.forEach((cent, ind) => {
		if(cent.mime === ent.mime) {
			//Combine extension first
			if(Array.isArray(cent.extension))
				cent.extension.push(ent.extension)
			else
				cent.extension = [cent.extension, ent.extension]

			//Next figure out byte signatures
			if(Array.isArray(ent.signature[0])) { //Are we an array of arrays?
				ent.signature.forEach(sig => {
					let eSigMatch = false
					if(Array.isArray(cent.signature[0])) {
						cent.signature.forEach(csig => {
							if( arrayEquals(sig, csig) )
								eSigMatch = true
						})
					} else {
						if( arrayEquals(sig, cent.signature) )
							eSigMatch = true
					}

					if(!eSigMatch) {
						if(Array.isArray(cent.signature[0]))
							cent.signature.push(sig)
						else
							cent.signature = [cent.signature, sig]
					}
				})
			} else {
				let eSigMatch = false
				if(Array.isArray(cent.signature[0])) {
					cent.signature.forEach(csig => {
						if( arrayEquals(ent.signature, csig) )
							eSigMatch = true
					})
				} else {
					if( arrayEquals(ent.signature, cent.signature) )
						eSigMatch = true
				}

				if(!eSigMatch) {
					if(Array.isArray(cent.signature[0]))
						cent.signature.push(ent.signature)
					else
						cent.signature = [cent.signature, ent.signature]
				}
			}

			found = true
		}
	})

	if(!found) {
		cleaned.push({
			mime: ent.mime,
			extension: ent.extension,
			signature: ent.signature
		})
	}
})

Fs.writeFileSync('./output/complete.json', JSON.stringify(cleaned))
Fs.writeFileSync('./output/mime-extensions.json', JSON.stringify(mimeData))

///////////////////////////////////////////
// Further Mime formats for dictionaries //
///////////////////////////////////////////
let mime2Ext = {},
	ext2Mime = {}

mimeData.forEach(dat => {
	if( !mime2Ext.hasOwnProperty(dat.mime) )
		mime2Ext[dat.mime] = dat.extensions[0]

	dat.extensions.forEach(ext => {
		if( !ext2Mime.hasOwnProperty(ext) )
			ext2Mime[ext] = dat.mime
	})
})

Fs.writeFileSync('./output/mime2ext.json', JSON.stringify(mime2Ext))
Fs.writeFileSync('./output/ext2mime.json', JSON.stringify(ext2Mime))

////////////////////////////////////////
// Minify the complete and all others //
////////////////////////////////////////

let dataMin = []

data.forEach(ent => dataMin.push({
	m: ent.mime,
	e: ent.extension,
	s: ent.signature
}))
Fs.writeFileSync('./output/complete.min.json', JSON.stringify(dataMin))