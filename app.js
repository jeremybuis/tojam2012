//done this way to include the static content in client
//wasnt able to figure out how to '../' when getting the path name for static
var server = require('./server/server').createServer(__dirname, 5000);