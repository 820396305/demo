 /* =========== window.IO 文件上传 ===========*/    
(function(){
	function fileUpload(){
		this.dom = document.createElement('input');
		this.dom.type='file';
		var _this = this,_files = [],index = 0;
		this.chooseFile = function(accept){
			this.dom.accept = accept || '*';
			this.dom.multiple = false;
			this.dom.click();
			this.dom.accept = '*';
		};
		this.chooseFiles = function(accept){
			this.dom.accept = accept || '*';
			this.dom.multiple = true;
			this.dom.click();
			this.dom.accept = '*';
		};
		this.delete = function(ix,callback,failcallback){
			ix = ix.index || ix;
			var i = this.getFileIndex(ix);
			if(i != -1 && _files.splice(i,1)){
				callback && callback();
			}else{
				failcallback && failcallback();
			}
		};
		this.getFile = function(ix){
			for(var i=0;i<_files.length;i++){
				if(_files[i].index==ix) return _files[i];
			}
			return null;
		}
		this.getFileIndex = function(ix){
			for(var i=0;i<_files.length;i++){
				if(_files[i].index==ix) return i;
			}
			return -1;
		}
		this.getFiles = function(filter){
            if(filter){     //过滤错误文件
                var _filesArr = [];
                for(var i= 0;i<_files.length;i++){
                     !_files[i].error && _filesArr.push(_files[i]);
                }
                return _filesArr;
            }
            return _files;
        };
        this.getSize = function(filter){
            var sum = 0;
            if(filter){     //过滤错误文件
                for(var i=0;i<_files.length;i++){
                    sum += _files[i].error ? 0 : _files[i].size;
                }
            }else{
                for(var i=0;i<_files.length;i++){
                    sum += _files[i].size;
                }
            }
            return sum;
        }
		
		this.upload = function(url,name,args,callback,failcallback){
			name = name || "upload[]";
			if(_files.length<=0){ failcallback && failcallback({status:-1,statusText:"未选择文件"});return; }
			var formData = new FormData();
			for(var i= 0;i<_files.length;i++){
				 !_files[i].error && formData.append(name,_files[i]);
			}
			for(var o in args){formData.append(o,args[o]);}
			 $.ajax({
                url : url,  
                type : 'POST',  
                data : formData,
                processData : false, 
                contentType : false,
                beforeSend:function(xhr){
     //            	xhr.upload.onprogress = function (event) {
					// 	if (event.lengthComputable) {
					// 		var complete = (event.loaded / event.total * 100 | 0);
					// 		console.log(complete);
					// 		//progress.value = progress.innerHTML = complete;
					// 	}
					// }
                },
                success : function(rs) {
                	callback && callback(rs);
                },  
                error:function(rs) {  
                    failcallback && failcallback(rs);
                }  
            });
		};
		this.clear = function(callback){
			_files = [];
			callback && callback();
		};
		this.change = function(callback,filter,fileEle){
			this.dom.onchange = function(){
				var files = _this.dom.files;
				_change(files);
			};
			if(fileEle){
				//拖动上传
				fileEle.ondragenter=function(e) {
					e.preventDefault();
				}
				fileEle.ondragover=function(e) {
					e.preventDefault();
				}
				fileEle.ondragleave=function(e) {
					e.preventDefault();
				}
				fileEle.ondrop=function(e) {
					var files = e.dataTransfer.files;
					_change(files);
					e.preventDefault();
				}
				//粘贴上传
				fileEle.onpaste = function(e){
					var clipboard = e.clipboardData;
				    // 有无内容
				    if(!clipboard.items || !clipboard.items.length){
				        return;
				    }
				    var temp = clipboard.items[0];
				    if(temp.kind === 'file' && temp.type.indexOf('image') === 0){
				        var files = temp.getAsFile();
				        files.name = 'untitled_'+Date.now()+'.'+temp.type.split('/')[1];
						_change([files]);
				    }
				}
			}

			function _change(files){
				if(files.length){
					for(var ig=0;ig<files.length;ig++){
						var errormsg = [];
						if(filter){
							if(filter.maxsize && files[ig].size > filter.maxsize){
								files[ig].error = true;
								errormsg.push('文件大小超过限制');
							}
							if(filter.minsize && files[ig].size < filter.minsize){
								files[ig].error = true;
								errormsg.push('文件大小低于限制');
							}
							if(filter.type){
								var error = true,name = files[ig].name,subfix = name.substring(name.lastIndexOf(".") + 1).toLowerCase();
								for(var j=0;j<filter.type.length;j++){
									if(files[ig].type.indexOf(filter.type[j]) != -1 || subfix == filter.type[j].toLowerCase()){
										error = false;
									}
								}
								if(error) {
									files[ig].error = true;
									errormsg.push('文件类型不正确');
								}
							}
						}
						files[ig].index = ++index;
						_files.push(files[ig]);
						callback(files[ig],errormsg.toString());
					}
					_this.dom.value = '';
				}
			}
		};
		this.chooseImage = function(){
			this.chooseFile("image/*");
		};
		this.chooseImages = function(){
			this.chooseFiles("image/*");
		};
		this.chooseCammar = function(){
			this.chooseFiles("video/*;capture=camcorder");
		}
		this.getImage = function(file,classname){
			file = file.index ? file : this.getFile(file);
			if(!file || file.type.indexOf('image')!=0){
				return null;
			}
			var img = new Image();
			if(window.URL){
				img.src = window.URL.createObjectURL(file);
			}else if(window.FileReader){
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function(e){
					img.src = this.result;
				}
			}
			img.alt = img.title = file.name;
			img.index = file.index;
			classname && (img.className = classname);
			img.onload = function(e) {
				window.URL && window.URL.revokeObjectURL(this.src); //释放object URL
			}
			img.onerror = function(){
				img.delete();
			}
			img.delete = function(ix){
				img.remove();
				img = null;
			}
			return img;
		}
		this.getText = function(file,callback){
			file = file.index ? file : this.getFile(file);
			if(!file || !window.FileReader){
				callback && callback();
			}
			var reader = new FileReader();
			reader.onload = function(){
				callback && callback(reader);
            };
           	reader.readAsText(file);
		}
		this.getImageSrc = function(file,callback){
			file = file.index ? file : this.getFile(file);
			if(!file || file.type.indexOf('image')!=0){
				callback(null);
			}
			if(window.URL){
				callback(window.URL.createObjectURL(file));
			}else if(window.FileReader){
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function(e){
					callback(this.result);
				}
			}else{
				callback(null);
			}
		}
		this.getImageBase64 = function(file,callback){
			file = file.index ? file : this.getFile(file);
			if(!file || file.type.indexOf('image')!=0){
				return null;
			}
			if(window.FileReader){
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function(e){
					callback(this.result);
				}
			}else{
				return null;
			}
		}
	}
	window.IO = $.extend(window.IO,{fileUpload:fileUpload});
})($);