QuickArchive
============

This is a file archiving library designed to be as simple, fast and space efficient
as possible. It's intended use is in transferring assets in web applications and
runs on node.js an the browsers. It does not use compression.




##Why?
Because if you have a a web application with a large number of files that you need
to load, it can be much quicker to load a single archive file than to load each file
individually.

Additionally, many JavaScript implementations of existing archive formats either
perform poorly, do not work as intended or don't work on both node.js and the brower.
QuickArchive never copies archived files and therefore never uses much more memory 
than the size of the archive.

Compression is not included because any decent browser or webserver can compress data
on the fly.




##API

First, create a new archive.

```javascript
var myArchive = new QuickArchive();

//with optional comments
myArchive.comment("An archive file.");
```

Next, add some data to it.

```javascript
//Data can be a string...
myArchive.addData("entry a", "Hello World");

//Or a buffer on node, or a ArrayBuffer or ArrayBufferView on browsers
myArchive.addData("entry b", new Buffer([1, 2, 3]));

//Also has optional comments
myArchive.addData("entry c", "This will be converted to binary data", "This is a text comment.");
```

Then call `toBuffer()` and do whatever you want with it.

```javascript
//Returns a Buffer on Node and a Uint8Array on browsers
var buffer = myArchive.toBuffer();
```

To load files, pass a Buffer or ArrayBuffer or ArrayBufferView to the constructor.

```javascript
//Copy the archive
var anotherArchive = new QuickArchive(buffer);
```





























