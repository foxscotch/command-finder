# CommandFinder.java

This is the Java implementation. It's a little better, arguably. It actually
handles errors instead of just crashing if it runs into a bad zip file.

I've tested it on Java SE 8u112, but I know it works on Java SE 8u92 as well,
and I'm sure it'll work on any other Java 8 release. It relies primarily on the
Java standard library, but it also has a dependency on Google's [GSON][].
Specifically, version 2.4, which can be found [here][].

[GSON]: https://github.com/google/gson
[here]: http://repo1.maven.org/maven2/com/google/code/gson/gson/2.4/gson-2.4.jar
