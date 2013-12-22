
(function () {

	var QuickArchive = require("../src/QuickArchive.js"),
		fs = require("fs");
		
	var fib = fs.readFileSync("fib.txt");
	var squares = fs.readFileSync("squares.txt");
	var kitty = fs.readFileSync("kitty.jpg");//length is 289587
	
	var ar = new QuickArchive();
	ar.addData("fib", fib, "A list of fibbinachi numbers");
	ar.addData("squares", squares, "A list of squares and square roots");
	ar.comment("A basic test file for the QCV format");
	
	fs.writeFileSync("basicTest.qcv", ar.toBuffer());
	
	
	
	ar = new QuickArchive();
	ar.addData("some/folder/kitty", kitty, "A cute kitten");
	ar.comment("A bigger archive file with a kitty in it");
	
	fs.writeFileSync("bigTest.qcv", ar.toBuffer());
	

}());