
#File Format

QuickArchive files are structured similarly to zip files, in that they have a short header,
an index at the end of the file, and the payload in the middle.

QuickArchive files will work if you concat two or more of them together, where files with
the same same in later archives exist, they will override files in earlier archives.

##Header

QuickArchive files use a 64 byte header. 32 of these are used, the rest must be
initialised to 0.

| Offset        | Meaning       |
| ------------- |:-------------:|
| 0             | Signature     |
| 8             | Version Number|
| 16            | Index Offset  |
| 24            | File Size     |
| 32            | Reserved      |
| 40            | Reserved      |
| 48            | Reserved      |
| 56            | Reserved      |
| 64+           | Data          |

##Index

The index must be at the end of the file and has the following form.

```javascript
{
     comment: "text",
     entries {
         name1: {offset: num, length: num, comment: "text"},
         name2: {offset: num, length: num, comment: "text"},
     },
}
```

Comment fields are optional.


