process.env.NODE_ENV = 'development';

var 
	http = require('http'),
	express = require('express'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	logger = require('morgan'),
	errorHandler = require('errorhandler'),
	static = require('serve-static'),
	routes = require('./lib/routes'),
	// morgan = require('morgan'),
	app = express(),
	server = http.createServer(app);

app.use(bodyParser.urlencoded({extended:true}))
	.use(methodOverride())
	// .use(express.basicAuth('user','spa'))
	.use(static(__dirname+'/public'));//静态文件之后添加路由中间件
	// .use(app.router);

if(process.env.NODE_ENV === 'development'){
	app.use(logger())
		.use(errorHandler({
			dumpExceptions : true,
			showStack : true
		}));
}else if(process.env.NODE_ENV === 'production'){
	app.use(express.errorHandler());	
}


routes.configRoutes(app,server);

server.listen(3000);
console.log('express server listening on port %d in %s mode',
	server.address().port,app.settings.env);
