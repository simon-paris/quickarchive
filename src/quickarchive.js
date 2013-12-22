/*
 * Copyright (C) 2013-2014 Simon Paris
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */



/**
 * Class: QuickArchive
 * 
 * A simple archiving format designed for transmitting files between web browsers
 * and servers with minimal performance cost and memory use.
 */
(function () {
    "use strict";
    
    
    var SIGNATURE_BYTES = [0x89, 0x51, 0x23, 0x56, 0x0D, 0x00, 0x0A, 0x0D],
                       //  0x89, Q,    C,    V,    \n,   \0,   \r,   \n
        HEADER_SLOTS = 8,
        HEADER_SLOT_SIZE = 8,
        HEADER_SIZE = HEADER_SLOTS * HEADER_SLOT_SIZE,
        VERSION = 1;
    
    
    
    
    
    
    /**
     * Constructor: QuickArchive
     * 
     * Creates a new QuickArchive. If the data parameter is set, the data will be loaded
     * into this object.
     * 
     * Parameters:
     *      data - (Optional) (Buffer/string) QuickArchive buffer to load.
     * 
     */
    function QuickArchive(data) {
        
        this.archiveComment = undefined;
        this.dataEntries = {};
        if (data) {
            if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data);
            } else if (this.isArrayBufferView(data)) {
                data = new Uint8Array(data.buffer);
            }
            this.loadFromBuffer(data);
        }
        
    }
    QuickArchive.prototype = Object.create(Object.prototype);
    QuickArchive.constructor = QuickArchive;
    
    
    
    
    
    
    /**
     * Function: comment
     * 
     * Sets or gets the file comment.
     * 
     * Parameters:
     *      comment - (Optional) (string) The file comment. If set, changes the
     *          comment.
     * 
     * Returns:
     * (string) The file comment.
     */
    QuickArchive.prototype.comment = function (comment) {
        if (comment) {
            this.archiveComment = comment;
        }
        return this.archiveComment;
    };
    
    
    
    
    
    
    /**
     * Function: addData
     * 
     * Adds an entry to this archive. If the archive already has an entry with the
     * same name it will be replaced.
     * 
     * If you pass null data but include a comment and the entry already existed,
     * the comment will be updated.
     * 
     * Parameters:
     *      name - (string) The name of the entry.
     *      data - (Buffer) The data.
     *      comment - (Optional) (string) The file comment.
     */
    QuickArchive.prototype.addData = function (name, data, comment) {
        
        if (!name) {
            return;
        }
        if (data instanceof String || typeof data === "string") {
            var temp = new BufferFactory(data.length);
            BufferShims.write(temp, data);
            data = temp;
        } else if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
        } else if (this.isArrayBufferView(data)) {
            data = new Uint8Array(data.buffer);
        }
        if (!data) {
            if (comment && this.dataEntries[name]) {
                this.dataEntries[name].comment = comment;
            }
        } else {
            this.dataEntries[name] = {data: data, comment: comment};
        }
        
    };
    
    
    
    
    
    
    /**
     * Function: getData
     * 
     * Gets the data with name.
     * 
     * Parameters:
     *      name - (string/undefined) The name of the entry you want.
     * 
     * Returns:
     * (Buffer) The data with name.
     */
    QuickArchive.prototype.getData = function (name) {
        
        if (this.dataEntries[name]) {
            return this.dataEntries[name].data;
        }
        return undefined;
        
    };
        
    
    
    
    
    
    /**
     * Function: addDataByCopy
     * 
     * Same as addData, but copies the data object.
     * 
     * Parameters:
     *      name - (string) The name of the entry.
     *      data - (Buffer) The data.
     *      comment - (Optional) (string) The file comment.
     */
    QuickArchive.prototype.addDataByCopy = function (name, data, comment) {
        
        var temp;
        if (data instanceof String || typeof data === "string") {
            temp = new BufferFactory(data.length);
            BufferShims.write(temp, data);
            data = temp;
        } else {
            temp = new BufferFactory(data.length);
            BufferShims.copy(data, temp, 0, 0, data.length);
            data = temp;
        }
        this.addData(name, data, comment);
        
    };
    
    
    
    
    
    
    /**
     * Function: removeData
     * 
     * Deletes an entry by name.
     * 
     * Parameters:
     *      name - (string) The name of the entry.
     */
    QuickArchive.prototype.removeData = function (name) {
        
        delete this.dataEntries[name];
        
    };
    
    
    
    
    
    /**
     * Function: getCommentOf
     * 
     * Returns the comment for a given entry.
     * 
     * Parameters:
     *      name - (string) The name of the entry.
     * 
     * Returns:
     * The comment for teh entry with name.
     */
    QuickArchive.prototype.getCommentOf = function (name) {
        
        if (this.dataEntries[name]) {
            return this.dataEntries[name].comment;
        }
        return undefined;
        

    };
    
    
    
    
    
    /**
     * Function: listEntries
     * 
     * Returns a list of the entries in the archive.
     * 
     * Returns:
     * (Array) A list of the entries.
     */
    QuickArchive.prototype.listEntries = function () {
        
        return Object.keys(this.dataEntries);
        
    };
    
    
    
    
    
    
    /**
     * Function: makeHeader
     * 
     * Returns the header object for the archive. The header object has the form:
     * {
     *      comment: "text",
     *      entries {
     *          name1: {offset: num, length: num, comment: "text"},
     *          name2: {offset: num, length: num, comment: "text"},
     *      },
     * }
     * 
     * The header describes the size and location of all the binary data in the file.
     * This excludes the header's size,  as we don't know how big it will be until we
     * create it.
     * 
     * Returns:
     * (Object) The header object.
     */
    QuickArchive.prototype.makeIndex = function () {
        
        var header = {
            comment: this.archiveComment,
            entries: {}
        };
        
        var offset = 0;
        for (var name in this.dataEntries) {
            if (this.dataEntries.hasOwnProperty(name)) {
                
                var el = this.dataEntries[name];
                header.entries[name] = {offset: offset,
                                        length: el.data.length,
                                        comment: el.comment
                                       };
                offset += el.data.length;
                
            }
        }
        
        return header;
        
    };
    
    
    
    
    
    
    /**
     * Function: toBuffer
     * 
     * Builds the archive and returns it as a buffer object. This copies all the
     * entries and therefore used extra memory.
     * 
     * Returns:
     * (Buffer) The QuickArchive buffer.
     */
    QuickArchive.prototype.toBuffer = function () {
        
        var totalSize = 0,
            cursor = 0,
            index = this.makeIndex();
        
        var indexString = JSON.stringify(index);
        
        for (var name in index.entries) {
            if (index.entries.hasOwnProperty(name)) {
                totalSize += index.entries[name].length;
            }
        }
        
        
        var indexOffset = totalSize + HEADER_SIZE;
                    //64 byte header        //header length
        totalSize += HEADER_SIZE + BufferFactory.byteLength(indexString, "ascii");
        
        
        //write signature
        var outputBuffer = new BufferFactory(totalSize);
        BufferShims.fill(outputBuffer, 0);
        for (var i = 0; i < SIGNATURE_BYTES.length; i++) {
            BufferShims.writeUInt8(outputBuffer, SIGNATURE_BYTES[i], i);
            cursor++;
        }
        
        //write the version number
        BufferShims.writeDoubleBE(outputBuffer, VERSION, cursor);
        cursor += HEADER_SLOT_SIZE;
        
        //write the location of the header
        BufferShims.writeDoubleBE(outputBuffer, indexOffset, cursor);
        cursor += HEADER_SLOT_SIZE;
        
        //write the size of the file
        BufferShims.writeDoubleBE(outputBuffer, totalSize, cursor);
        cursor += HEADER_SLOT_SIZE;
        
        //write the index
        BufferShims.write(outputBuffer, indexString, indexOffset, outputBuffer.length - indexOffset, "ascii");
        cursor = HEADER_SIZE;
        for (name in index.entries) {
            if (index.entries.hasOwnProperty(name)) {
                
                var entry = index.entries[name];
                BufferShims.copy(this.dataEntries[name].data, outputBuffer, cursor + entry.offset, 0, entry.length);
                
            }
        }
        
        return outputBuffer;
        
    };
    
    
    
    
    
    
    /**
     * Function: checkHeader
     * 
     * Returns whether the header is valid. If throwIfInvalid is set, an error will
     * be thrown when the header is invalid.
     * 
     * Parmeters:
     *      buffer - (Buffer) The buffer to validate.
     *      throwIfInvalid - (boolean) If set, throws an error on failure.
     * 
     * Returns:
     * (boolean) True if the header is valid.
     */
    QuickArchive.prototype.checkHeader = function (buffer, throwIfInvalid) {
        
        var error = null,
            throwFunc = function () {
                if (throwIfInvalid) {
                    throw new Error(error);
                }
            };
        
        
        if (buffer.length < HEADER_SIZE) {
            error = "Buffer is not a QuickArchive file.";
            throwFunc();
        }
        
        //Make an effort to describe why the signature bytes are not valid.
        if (buffer[1] !== SIGNATURE_BYTES[1] ||
            buffer[2] !== SIGNATURE_BYTES[2] ||
            buffer[3] !== SIGNATURE_BYTES[3]) {
            error = "Buffer is not a QuickArchive file.";
            throwFunc();
        }
        if (buffer[0] !== SIGNATURE_BYTES[0]) {
            error = "QuickArchive file is corrupted. " +
                            "This is probably because it was read as UTF8 text.";
            throwFunc();
        }
        if (buffer[4] !== SIGNATURE_BYTES[4]) {
            error = "QuickArchive file is corrupted. " +
                            "This may be because it was converted to DOS line endings.";
            throwFunc();
        }
        if (buffer[5] !== SIGNATURE_BYTES[5]) {
            error = "QuickArchive file is corrupted. " +
                            "It may have been read as a C string.";
            throwFunc();
        }
        if (buffer[6] !== SIGNATURE_BYTES[6] ||
            buffer[7] !== SIGNATURE_BYTES[7]) {
            error = "QuickArchive file is corrupted. " +
                            "This may be because it was converted to Unix line endings.";
            throwFunc();
        }
        
        return (!error);
        
    };
    
    
    
    
    
    /**
     * Function: loadFromBuffer
     * 
     * Loads data from a buffer.
     * 
     * Parameters:
     *      buffer - (Buffer) The buffer to load.
     */
    QuickArchive.prototype.loadFromBuffer = function (buffer) {
        
        var archiveStart = 0;
                
        while (archiveStart < buffer.length) {
            
            //validate the header. If this is the start of the file, throw an error
            //if it isn't valid. Otherwise just stop if invalid.
            if (!this.checkHeader(BufferShims.slice(buffer, archiveStart), archiveStart === 0)) {
                return;
            }
            
            //signature
            var cursor = archiveStart;
            cursor += HEADER_SLOT_SIZE;
            
            //read the version number
            var version = BufferShims.readDoubleBE(buffer, cursor);
            cursor += HEADER_SLOT_SIZE;
            
            //read header offset
            var indexOffset = BufferShims.readDoubleBE(buffer, cursor);
            cursor += HEADER_SLOT_SIZE;
            
            //read file length
            var fileLength = BufferShims.readDoubleBE(buffer, cursor);
            cursor += HEADER_SLOT_SIZE;
            
            //index
            cursor = archiveStart + HEADER_SIZE;
            var index = BufferShims.toString(buffer, "ascii", archiveStart + indexOffset, archiveStart + fileLength);
            index = JSON.parse(index);
        
            //parse the header
            this.archiveComment = index.comment;
            for (var name in index.entries) {
                if (index.entries.hasOwnProperty(name)) {
                    
                    var entry = index.entries[name];
                    var buf = BufferShims.slice(buffer, entry.offset + cursor, entry.offset + entry.length + cursor);
                    this.addData(name, buf, entry.comment);
                    
                }
            }
            
            archiveStart += fileLength;
            
        }
        
    };
    
    
    
    
    /**
     * Function: loadFromBuffer
     * 
     * Loads data from a buffer.
     * 
     * Parameters:
     *      buffer - (Buffer) The buffer to load.
     */
    QuickArchive.prototype.isArrayBufferView = function (buf) {
        
        if (buf instanceof Int8Array ||
           buf instanceof Uint8Array ||
           buf instanceof Int16Array ||
           buf instanceof Uint16Array ||
           buf instanceof Int32Array ||
           buf instanceof Uint32Array ||
           buf instanceof Float32Array ||
           buf instanceof Float64Array) {
            return true;
        }
        return false;
        
    };
    
    
    
    
    var BufferShims = {};
    
    if (typeof Buffer === "undefined") {
        
        
        /**
         * Function: fill
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferShims.fill = function(buf, val) {
            for (var i = 0; i < this.length; i++) {
                buf[i] = val;
            }
        };
        
        /**
         * Function: readDoubleBE
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferShims.readDoubleBE = function(buf, offset) {
            var view = new DataView(buf.buffer);
            return view.getFloat64(offset, false);
        };
        
        /**
         * Function: writeDoubleBE
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferShims.writeDoubleBE = function(buf, val, offset) {
            var view = new DataView(buf.buffer);
            return view.setFloat64(offset, val, false);
        };
        
        /**
         * Function: readUInt8
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferShims.readUInt8 = function(buf, offset) {
            var view = new DataView(buf.buffer);
            return view.getUint8(offset);
        };
        
        /**
         * Function: writeUInt8
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferShims.writeUInt8 = function(buf, val, offset) {
            var view = new DataView(buf.buffer);
            view.setUint8(offset, val);
        };
        
        /**
         * Function: write
         * Works the same as in node. Only set if Buffer is not set.
         * Only supports ascii.
         */
        BufferShims.write = function(buf, str, offset, len, encoding) {
            
            if (encoding && encoding !== "ascii") {
                throw new Error("unsupported encoding");
            }
            if (typeof len === "undefined") {
                len = str.length;
            }
            if (!offset) {
                offset = 0;
            }
            for (var i = 0; i < len; i++) {
                buf[i + offset] = str.charCodeAt(i) & 0x7F;
            }
            
        };
        
        /**
         * Function: copy
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferShims.copy = function(buf, target, targetStart, sourceStart, sourceEnd) {
            
            if (!targetStart) {
                targetStart = 0;
            }
            if (!sourceStart) {
                sourceStart = 0;
            }
            if (!sourceEnd) {
                sourceEnd = buf.length;
            }
            var copyLen = sourceEnd - sourceStart,
                difference = sourceStart - targetStart;
            for (var i = targetStart; i < copyLen + targetStart; i++) {
                target[i] = buf[i + difference];
            }
            
        };
        
        /**
         * Function: slice
         * Works the same as in node. Only set if Buffer is not set.
         * Like in node, this returns a view. This is important to note because it
         * replaces ArrayBuffer.slice, which works like copy.
         */
        BufferShims.slice = function(buf, start, end) {
            
            if (typeof end === "undefined") {
                end = buf.length;
            }
            var b = new BufferFactory(new Uint8Array(buf.buffer, start, end - start));
            return b;
            
        };
        
        /**
         * Function: toString
         * Works the same as in node. Only set if Buffer is not set.
         * Only supports ascii.
         */
        BufferShims.toString = function(buf, encoding, start, end) {
            
            if (encoding && encoding !== "ascii") {
                throw new Error("unsupported encoding");
            }
            if (!start) {
                start = 0;
            }
            if (!end) {
                end = 0;
            }
            var length = end - start;
            var str = "";
            for (var i = start; i < length + start; i++) {
                str += String.fromCharCode(buf[i]);
            }
            return str;
            
        };

        
    } else {
        
        //Oh dear god this is a horrible hack
        var makeStaticBufferFunc = function (name) {
            return function (inst) {
                return Buffer.prototype[name].apply(inst, Array.prototype.slice.call(arguments, 1));
            };
        };
        for (var prop in Buffer.prototype) {
            if (Buffer.prototype.hasOwnProperty(prop)) {
                BufferShims[prop] = makeStaticBufferFunc(prop);
            }
        }
    }
    
    
    /**
     * Function: BufferFactory
     * 
     * This function returns a Buffer on Node.js and returns a UInt8Array in browsers.
     * It also emulates the node.js Buffer constructor in browsers.
     * 
     * It can be used with new.
     * 
     * Parameters:
     *      input - (Integer/Array/ArrayBufferView/ArrayBuffer) Works exactly the
     *                      same as node's Buffer.
     * 
     * Returns:
     * (Buffer/UInt8Array) Returns a Buffer or a a Uint8Array, whichever is avalible.
     */
    function BufferFactory(input) {
        
        if (typeof Buffer !== "undefined") {
            
            return new Buffer(input);
            
        } else if (typeof ArrayBuffer !== "undefined") {
            
            var buf;
            
            if (input instanceof Uint8Array) {
                buf = input;
                buf = new Uint8Array(buf);
            
            } else if (Array.isArray(input)) {
                buf = new ArrayBuffer(input.length);
                buf = new Uint8Array(buf);
                for (var i = 0; i < input.length; i++) {
                    buf[i] = input[i];
                }
                
            } else if (typeof input === "number") {
                buf = new ArrayBuffer(input);
                buf = new Uint8Array(buf);
            
            }
            
            return buf;
            
        } else {
            throw new Error("No buffer type.");
        }
        
        
        
    }
    
    
    
    
    
    if (typeof Buffer !== "undefined") {
        
        BufferFactory.byteLength = Buffer.byteLength;
        BufferFactory.concat = Buffer.concat;
        
    } else {
        
        /**
         * Function: BufferFactory.byteLength
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferFactory.byteLength = function(string) {
            return string.length;
            /*var utf8length = 0;
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utf8length++;
                } else if ((c > 127) && (c < 2048)) {
                    utf8length = utf8length+2;
                } else {
                    utf8length = utf8length+3;
                }
            }
            return utf8length;*/
        };
        
        /**
         * Function: BufferFactory.concat
         * Works the same as in node. Only set if Buffer is not set.
         */
        BufferFactory.concat = function(a) {
            var len = 0,
                cursor = 0,
                output = null;
            
            for (var n = 0; n < a.length; n++) {
                len += a[n].length;
            }
            
            for (n = 0; n < a.length; n++) {
                BufferShims.copy(a[n], this, cursor);
                cursor += a[n].length;
            }
            
            return output;
        };
        
        
    }
    
    
    
    
    
    
    QuickArchive.PolyfillBuffer = BufferFactory;
    QuickArchive.BufferShims = BufferShims;
    
    if (typeof module !== "undefined") {
        module.exports = QuickArchive;
    } else if (typeof window !== "undefined") {
        window.QuickArchive = QuickArchive;
    }
    
    
}());
