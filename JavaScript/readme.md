# command-finder.js

Here we have the JavaScript implementation. Or, at least, we will have it.

Doing stuff with npm here will probably give you a warning about package.json
not having a repository field. But I don't think it's technically right to link
to a repo that isn't supposed to be the repo specifically for the npm project
you're linking from, so...

Yes, this one has more dependencies. Would be one less, but Node doesn't include
a module for zip files by default. And I'm trying to make it more usable, but
don't want to write argument parsing code, because that isn't the goal here.  
Anyway, those dependencies can of course be found in package.json, so just
`npm install` away.
