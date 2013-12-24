
(function () {
    "use strict";
    
    var QuickArchive,
        fs;
    if (typeof require !== "undefined") {
        QuickArchive = require("../src/quickarchive.js");
        fs = require("fs");
    } else if (typeof global !== "undefined") {
        QuickArchive = global.QuickArchive;
    } else if (typeof window !== "undefined") {
        QuickArchive = window.QuickArchive;
    }
    var BufferFactory = QuickArchive.BufferFactory,
        BufferShims = QuickArchive.BufferShims;
    
    
    describe("quickarchive", function () {
        
        
        
        
        it("should be able to set the archive comment", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //set the comment
            expect(ar.comment()).toEqual(undefined);
            ar.comment("hello world");
            expect(ar.comment()).toEqual("hello world");
            
        });
        
        
        
        it("should add a buffer to the archive without comment", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            ar.addData("test", new BufferFactory([5,6,7]));
            ar.addData("test2", new BufferFactory([1,2,3,4]));
            var data = ar.getData("test");
            
            //test that the data is correct
            expect(data[0]).toEqual(5);
            expect(data[1]).toEqual(6);
            expect(data[2]).toEqual(7);
            
            //test that we have the correct entries list
            var keys = ar.listEntries();
            expect(keys.length).toEqual(2);
            expect(keys.indexOf("test")).not.toEqual(-1);
            expect(keys.indexOf("test2")).not.toEqual(-1);
        });
        
        
        
        it("should add a buffer to the archive with a comment", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            ar.addData("test", new BufferFactory([5,6,7]), "comment");
            expect(ar.getCommentOf("test")).toEqual("comment");
            
            ar.addData("test", null, "comment2");
            expect(ar.getCommentOf("test")).toEqual("comment2");
            
            expect(ar.getData("test").length).toEqual(3);
            
        });
      
        
        it("should add data as a string", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            ar.addData("test", "abc");
            var data = ar.getData("test");
            if (typeof Buffer !== "undefined") {
                expect(data instanceof Buffer).toBe(true);
            } else {
                expect(data instanceof Uint8Array).toBe(true);
            }
            expect(data[0]).toEqual(97);
            expect(data[1]).toEqual(98);
            expect(data[2]).toEqual(99);
            
        });
      
        
        
        
        it("should remove an entry", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            ar.addData("test", new BufferFactory([5,6,7]), "comment");
            ar.removeData("test");
            expect(ar.getData("test")).toEqual(undefined);
            
        });
        
        
        
        
        it("should use views, no copies should be made unless requested", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            var d1 = new BufferFactory([5,6,7]);
            ar.addData("view", d1);
            ar.addDataByCopy("copy", d1);
            d1[0] = 1;
            expect(ar.getData("view")[0]).toEqual(1);
            expect(ar.getData("copy")[0]).toEqual(5);
            
        });
        
        
        
        
        it("should use views when loading from a file", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            var d1 = new BufferFactory([5,6,7]);
            ar.addData("view", d1);
            
            var ar2 = new QuickArchive(ar.toBuffer());
            ar2.getData("view")[0] = 2;
            
            var ar3 = new QuickArchive(ar2.toBuffer());
            expect(ar3.getData("view")[0]).toEqual(2);
            
        });
        
        
        
        it("should serialize and deserialize an archive", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            //add data and read it back
            ar.comment("comment");
            ar.addData("test", new BufferFactory([5,6,7]), "comment2");
            
            var ar2 = new QuickArchive(ar.toBuffer());
            
            expect(ar.comment()).toEqual("comment");
            expect(ar.getCommentOf("test")).toEqual("comment2");
            var data = ar.getData("test");
            expect(data[0]).toEqual(5);
            expect(data[1]).toEqual(6);
            expect(data[2]).toEqual(7);

        });
        
        
        
        
        it("should serialize empty archive", function () {
            
            //empty archive
            var ar = new QuickArchive();
            
            var ar2 = new QuickArchive(ar.toBuffer());
            
            expect(ar.comment()).toEqual(undefined);
            expect(ar.getCommentOf("test")).toEqual(undefined);
            expect(ar.listEntries().length).toEqual(0);
        });
        
        
        
        
        
        
        
        it("should sould load multiple concatted buffers", function () {
            
            var data = [1,2,3];
            var buffers = [];
            var totalLength = 0;
            
            //empty archive
            for (var i = 0; i < 3; i++) {
                var ar = new QuickArchive();
                
                //add data and read it back
                ar.comment("test" + i);
                ar.addData("test" + i, new BufferFactory([data[i]]), "comment");
                ar.addData("overwritten", new BufferFactory([data[i]]));
                
                var buf = ar.toBuffer();
                totalLength += buf.length;
                
                buffers.push(buf);
            }
            
            var output = new BufferFactory(totalLength),
                cursor = 0;
            
            for (i = 0; i < buffers.length; i++) {
                BufferShims.copy(buffers[i], output, cursor);
                cursor += buffers[i].length;
            }
            var ar2 = new QuickArchive(output);
            
            expect(ar2.comment()).toEqual("test2");
            
            for (i = 0; i < buffers.length; i++) {
                var d = ar2.getData("test" + i);
                expect(d[0]).toEqual(data[i]);
                expect(ar2.getCommentOf("test" + i)).toEqual("comment");
            }
            
            var d2 = ar2.getData("overwritten");
            expect(d2[0]).toEqual(data[2]);
            
        });
        
        
                
        it("should survive with arbitrary data appended", function () {
            
            //empty archive
            var ar = new QuickArchive();
            ar.addData("test", new BufferFactory([5,6,7]));
            
            var ar2 = new QuickArchive(BufferFactory.concat([
                ar.toBuffer(),
                new BufferFactory([1,5,3,5,6,4])
            ]));
            
            expect(ar.listEntries().length).toEqual(1);
            var data = ar.getData("test");
            expect(data[0]).toEqual(5);
            expect(data[1]).toEqual(6);
            expect(data[2]).toEqual(7);

        });
        
        
        var fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610,
                    987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025,
                    121393, 196418, 317811, 514229];
        
        function validateFib(text) {
            var rows = text.split("\n");
            for (var i = 0; i < rows.length; i++) {
                rows[i] = rows[i].replace(/[ \t\r]/gim, " ");
                var start = parseInt(rows[i].split(" ")[0], 10);
                var end = parseInt(rows[i].split(" ")[1], 10);
                expect(fibs[start]).toEqual(end);
            }
        }
        
        function validateSquares(text) {
            
            var rows = text.split("\n");
            for (var i = 0; i < rows.length; i++) {
                rows[i] = rows[i].replace(/[ \t\r]+/gim, " ");
                var index = parseInt(rows[i].split(" ")[0], 10);
                var square = parseInt(rows[i].split(" ")[1], 10);
                var sqrt = parseFloat(rows[i].split(" ")[2]);
                expect(index * index).toEqual(square);
                expect(Math.sqrt(index)).toBeCloseTo(sqrt, 3);
                
            }
            
        }
        
        
        
        
        if (typeof Buffer !== "undefined") {
            
            //these tests only works on node because browser doesn't have
            //toString("utf8"). TODO: support these tests on the browser
        
            it("should detect corruption", function () {
                
                //empty archive
                var ar = new QuickArchive();
                
                var buffer = ar.toBuffer();
                buffer = buffer.toString("utf8");
                buffer = new BufferFactory(buffer);
                
                function corruptArchive() {
                    var ar2 = new QuickArchive(buffer);
                }
                
                expect(corruptArchive).toThrow();
                
            });
        
            
    
            it("should load realistic text files", function () {
                
                var buffer = fs.readFileSync("./specs/basicTest.qcv");
                
                var ar = new QuickArchive(buffer);
                
                expect(ar.comment()).toEqual("A basic test file for the QCV format");
                
                var d1 = ar.getData("fib");
                expect(ar.getCommentOf("fib")).toEqual("A list of fibbinachi numbers");
                var d2 = ar.getData("squares");
                expect(ar.getCommentOf("squares")).toEqual("A list of squares and square roots");
                (validateFib.bind(this))(d1.toString());
                (validateSquares.bind(this))(d2.toString());
    
                
            });
            
            
    
            
            
            it("should load a large binary file", function () {
                
                var buffer = fs.readFileSync("./specs/bigTest.qcv");
                var ar = new QuickArchive(buffer);
                
                expect(ar.comment()).toEqual("A bigger archive file with a kitty in it");
                
                var d = ar.getData("some/folder/kitty");
                expect(ar.getCommentOf("some/folder/kitty")).toEqual("A cute kitten");
                expect(d.length).toEqual(289587);
                
                
            });
            
        } else {
            
            //these tests test conversion from ArrayBuffers to Uint8Arrays and
            //do not run on node.
            
            it("should add data as an arraybuffer", function () {
                
                //empty archive
                var ar = new QuickArchive();
                
                var dIn = new ArrayBuffer(3);
                dIn = new Uint8Array(dIn);
                dIn[0] = 1;
                dIn[1] = 2;
                dIn[2] = 3;
                
                //add data and read it back
                ar.addData("abc", dIn.buffer);
                var ar2 = new QuickArchive(ar.toBuffer().buffer);
                var data = ar2.getData("abc");
                expect(data[0]).toEqual(1);
                expect(data[1]).toEqual(2);
                expect(data[2]).toEqual(3);
                expect(data instanceof Uint8Array).toBe(true);
                
            });
            
            
            it("should add data as an arraybufferview", function () {
                
                //empty archive
                var ar = new QuickArchive();
                
                var dIn = new ArrayBuffer(3);
                dIn = new Uint8Array(dIn);
                dIn[0] = 1;
                dIn[1] = 2;
                dIn[2] = 3;
                
                //add data and read it back
                ar.addData("abc", dIn.buffer);
                var ar2 = new QuickArchive(new Int16Array(ar.toBuffer().buffer));
                var data = ar2.getData("abc");
                expect(data[0]).toEqual(1);
                expect(data[1]).toEqual(2);
                expect(data[2]).toEqual(3);
                expect(data instanceof Uint8Array).toBe(true);
                
            });

            
        }
        
    });

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
}());