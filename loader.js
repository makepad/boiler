var script = document.currentScript;
(function(){

	function watchFileChange(){
		var req = new XMLHttpRequest()
		req.timeout = 60000
		req.addEventListener("error", function(){
			setTimeout(function(){
				location.href = location.href
			}, 500)
		})
		req.responseType = 'text'
		req.addEventListener("load", function(){
			if(req.response === 'retry') return watchFileChange()
			if(req.status === 200){
				location.href = location.href
			}
		})
		req.open("GET", "/$watch?"+(''+Math.random()).slice(2))
		req.send()
	}

	var modules = {}
	var moduleSource = {}
	function buildPath(base, rel){
		var baseSegs = base.split('/')
		var relSegs = rel.split('/')
		if(relSegs[0] === '') return rel
		for(var i = 0; i < relSegs.length; i++){
			var seg = relSegs[i]
			if(seg === '..'){
				baseSegs.pop()
			}
			else if(seg === '.'){
				continue
			}
			else{
				baseSegs.push(seg)
			}
		}
		return baseSegs.join('/')
	}

	function getBasePath(path){
		return path.slice(0, path.lastIndexOf('/'))
	}

	function createRequire(basePath) {
        function require(path) {
            var modulePath = buildPath(basePath, path)
            var module = modules[modulePath]
            if (module) {
                return module.exports
            }
            try{
	            var source = moduleSource[modulePath]
                var factory = new Function("require", "exports", "module", source + "\n//# sourceURL=" + location.origin + modulePath + "\n")
            }
            catch(e){
        	console.log("EXCEPTION", e,path)

                var script = document.createElement('script')
                script.src = location.origin + modulePath
                script.type = 'text/javascript'
                document.getElementsByTagName('head')[0].appendChild(script)
                return
            }
            module = {exports:{}, filename:modulePath}
            var require = createRequire(getBasePath(modulePath))
            var exports = factory.call(module.exports, require, module.exports, module)
            if (exports !== undefined) {
                module.exports = exports
            }
            modules[modulePath] = module
            return module.exports
        }
        return require
    }

	function downloadText(absPath){
		return new Promise(function(resolve, reject){
			req = new XMLHttpRequest()
			req.responseType = 'text'
			req.addEventListener('error', function(){
				reject(req)
			})
			req.addEventListener('load', function(){
				if(req.status !== 200) return reject(req)
				moduleSource[absPath] = req.response
				resolve(req)
			})
			req.open('GET', location.origin + absPath)
			req.send()
		})
	}

	var loadPromises = {}

	function downloadJS(absPath){
		var promise = loadPromises[absPath]
		if(promise) return promise

		var basePath = getBasePath(absPath)

		return loadPromises[absPath] = downloadText(absPath).then(function(req){
			var source = req.response.replace(/\/\*[\S\s]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')
			var depProms = []
			source.replace(/require\s*\(\s*['"](.*?)['"]\s*\)/g, function(m, path){
				var absDepPath = buildPath(basePath, path)
				depProms.push(downloadJS(absDepPath))
			})
			return Promise.all(depProms)
		})
	}

	function init(){
		watchFileChange()
		var mainPath = script.getAttribute('main')
		downloadJS(mainPath).then(function(){
			var require = createRequire("/", mainPath)
			var main = require(mainPath)
		})
	}

	document.addEventListener('DOMContentLoaded', init)
})()