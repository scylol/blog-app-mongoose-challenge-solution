require('dotenv').config();
exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL;
                    //   'mongodb://localhost/blog-app';
exports.PORT = process.env.PORT || 8080;
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
//LIVE LINK
//mongo ds129641.mlab.com:29641/blogdb -u foo -p bar
//TEST LINK
//mongo ds129641.mlab.com:29641/testblogdb -u foo -p bar
