# Content-Type Negotiation

A compiled list and resources to figure out content-type, and extensions for files. Each list is JSON format and comes with multiple variations. Feel free to transpile the list if it doesn't fit your needs.

## JSON Files
There are 4 different json files located in the `/bin/` folder.
 * `mime-extensions.json` - Array of objects each containing a MIME string and the corresponding extensions associated with it. The extensions property is an array as there could be multiple extensions; ie: image/jpeg could be jpg, jpeg, or even jpe
 * `mime2ext.json` - Dictionary object containing the mime as a key and a single extension as the value. _NOTE: The value is automatically pulled during conversion so it may not be the most popular extension_
 * `ext2mime.json` - Dictionary object containing the extension as the key, and the common MIME type as the value
 * `complete.json` - Array of objects each containing a mime type, extensions, and byte-sginatures. The byte-signatures are the known "magic numbers" found in the file's header.

The files directly in `/bin/` are pretty-formatted JSON files, the original condensed versions are located in `/converter/output/`

## Data Type Description
The files `mime2ext.json` and `ext2mime.json` are pretty self-explanitory, the complicated one is `complete.json`. The novice JSON/JavaScript user should be able to figure it out instantly but in case not, heres the layout:

```
{
    "mime": "image/jpeg",
    "extension": ["jpe", "jpeg", "jpg"],
    "signature": [255, 216, 255]
}
```
 * mime - Always a string, every object has at least the mime-type. It is one of the requirements when converting
 * extension - Either a string, or an array of strings, there's no order to extensions (the converter assembles this arbitrarily) so the most "popular" may not be first.
 * signature - Always an array, but may be an array-of-arrays. The signatures represent the "magic numbers" found in a file's header. The values of the signature are base-10 and NOT hex. In the case of array-of-arrays value it's because multiple signatures could match that type.

## In Progress
 * Small JavaScript library to make sense of the lists. Should be useful for anyone having to deal with uploads/downloads and cloud systems.
 * Considering a Java library for server-side parsing

## Data Sources
Information used to generate these files was gatherered from
 * http://svn.apache.org/viewvc/httpd/httpd/branches/2.2.x/docs/conf/mime.types?revision=1750837&view=co
 * http://www.garykessler.net/library/file_sigs.html
