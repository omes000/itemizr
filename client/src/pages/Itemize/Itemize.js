import React, { Component } from "react";
import Modal from 'react-modal';
import Quagga from 'quagga';
import "./styles.css";
import API from "../../utils/API";
import { ModalType, ManualModal, ScannerModal } from '../../components/Modal';
import ReactTable from 'react-table';
//import "../../node_modules/react-table/react-table.css";

class Itemize extends Component {
	constructor() {
		super();
		this.state = {
			currentModal: null,
			modalIsOpen: false,
			editBeforeDatabase: false,
			code: "", 
			data: "",
			profile: "", 
			user_id: "", 
			savedItems: [], 
			item: {
				productName:"",
				companyName:"",
				ean: "",
				upca: "",
				category: "",
				desc: "",
				price_new: "",
				image: "",
				location: ""
			},
			format:"", //remove

			//does livestreamconfig need to be in state?
			//need to test if can remove from state.
			liveStreamConfig: {
				inputStream: {
					name: "Live",
					type: "LiveStream",
					target: document.querySelector('#scanner-container'),
					constraints: {
						width: 1920,
						height: 1080,
						facingMode: "environment"
					},
				},
				locator: {
					patchSize: "medium",
					halfSample: true
				},
				numOfWorkers: 4,
				frequency: 1,
				decoder: {
					readers: [
					"code_128_reader",
					"ean_reader",
					"ean_8_reader",
					"code_39_reader",
					"code_39_vin_reader",
					"codabar_reader",
					"upc_reader",
					"upc_e_reader",
					"i2of5_reader",
					"2of5_reader",
					"code_93_reader"
					],
					debug: {
						showCanvas: true,
						showPatches: true,
						showFoundPatches: true,
						showSkeleton: true,
						showLabels: true,
						showPatchLabels: true,
						showRemainingPatchLabels: true,
						boxFromPatches: {
							showTransformed: true,
							showTransformedBox: true,
							showBB: true
						}
					}
				}
			},
			//does canvas need to be in here?
			canvas: "" //maybe remove
		};

		this.openModal = this.openModal.bind(this);
		this.handleScannerModalChange = this.handleScannerModalChange.bind(this);
		this.handleManualModalChange = this.handleManualModalChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleOpenModal = this.handleOpenModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
	}

	login() {
		this.props.auth.login();
	}

	logout() {
		this.props.auth.logout();
		this.setState({user_id: ""})
	}

	checkForUser(user_id){
		//if a user deletes all of their items, then what? Either add dummy data or do api call to search for user id
		API.getUserSavedItems(user_id).then(res => {
			console.log("res", res);
			if (res.data === null){
				API.createUser(this.state.user_id).then(res => {
					console.log("res", res);
				})
			}
			this.loadSavedItems();
		}).catch(err => console.log(err));
	}

	componentWillMount() {
		Modal.setAppElement('#root');
		this.setState({ profile: {} });
		const { userProfile, getProfile } = this.props.auth;
		console.log(userProfile)
		console.log(localStorage.user_id);
		console.log(JSON.stringify(localStorage.authresult))
		
		console.log(this.state);
		//console.log(localStorage.user_id)
		 //need to figure out how to check if user exists based on async
		
		//console.log("user", this.state.profile)


		//******check if this is necessary:*******
		if (!userProfile) {
		 console.log('here')
		     getProfile((err, profile) => {
		    this.setState({ profile });
		    this.setState({user_id: this.state.profile.sub})
		    this.checkForUser(this.state.user_id)
		    console.log(this.state.profile)
		  });
		} else {
		  this.setState({ profile: userProfile, user_id: userProfile.sub }, function () {
		//      console.log(this.state.profile);
			this.checkForUser(this.state.user_id)
		})
		//this.loggedIn();
		}
	}

	loadUserSavedItems = (userId) => {
		API.getUserSavedItems(userId).then(res => {
			this.setState({ savedItems: res.data.item })
		}).catch(err => console.log(err));
	}

	loadSavedItems = () => {
		API.getUserSavedItems(this.state.user_id).then(res => {
			this.setState({ savedItems: res.data.items })
			console.log(this.state.saveItems)
		}).catch(err => console.log(err));
	}

	loggedIn = () => {
		// this.setState({loggedIn: true, user_id: "4"},  function () {
		// 	console.log(this.state.user_id);
		// 	this.loadUserSavedItems(this.state.user_id)
		// 	console.log(this.state.profile);
		// });
	}

	handleItemSave = (item) => {
		API.saveItem(this.state.user_id,{
			productName: item.productName,
			companyName: item.companyName,
			ean: item.ean,
			upca: item.upca,
			category:item.category,
			desc:item.desc,
			price_new:item.price_new,
			image:item.image,
			location:item.location
		})
		.then(res => {
			console.log(res)
			//API.updateUserItems(this.state.user_id, res.data._id)
			this.loadSavedItems();
		})
		.catch(err => console.log(err));
	};

	handleScannerModalChange = (event) => {
		const { name, value } = event.target;
		console.log(event.target)
		this.setState({
			[name]: value
		});
	}

	handleManualModalChange = (event) => {
		const { name, value } = event.target;
		this.setState({
			item: Object.assign({}, this.state.item, {
				[name]: value
			}),
		})
	}

	startQuagga = () => {
		//console.log("this is", this);
		//console.log(this.state.liveStreamConfig.inputStream.target)
		console.log(this.props.auth)
		console.log(this.state.profile);
		//this.loggedIn();
		let selector = Object.assign({}, this.state.liveStreamConfig);
		//while(selector.inputStream.target === null){
		selector.inputStream.target = document.querySelector('#scanner-container');
		//}
		//console.log(selector)
		this.setState({liveStreamConfig: selector});
		Quagga.init(
			this.state.liveStreamConfig, (err) => {
			if (err) {
				console.log(err);
				this.stopQuagga();
				return
			}
			this.initCameraSelection();
			console.log("Initialization finished. Ready to start");
			Quagga.start();

					// Set flag to is running
					//_scannerIsRunning = true;
		});

		Quagga.onProcessed((result) =>{
			var drawingCtx = Quagga.canvas.ctx.overlay,
			drawingCanvas = Quagga.canvas.dom.overlay;
			//console.log(drawingCanvas.getAttribute("width"))
			this.setState({canvas: drawingCanvas.getAttribute("width")})

			if (result) {
				if (result.boxes) {
					drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
					result.boxes.filter(function (box) {
						return box !== result.box;
					}).forEach(function (box) {
						Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
					});
				}

				if (result.box) {
					Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
				}

				if (result.codeResult && result.codeResult.code) {
					Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
				}
			}
		});

		Quagga.onDetected( (result) => {
			console.log("Barcode detected and processed : [" + result.codeResult.code + "]", result);
			this.setState({code:result.codeResult.code, format:result.codeResult.format }) ;
		})
	}

	stopQuagga = () =>{
		Quagga.stop();
		this.closeModal();
	}

	handleSubmit(event){
		event.preventDefault();
		console.log(this.state.code)
		if(this.state.code){
			this.setState({editBeforeDatabase: true})
			this.stopQuagga();

			this.getProductInfo();
		}
		else if(this.state.item.productName){
			console.log("to the database!");
			console.log(this.state.item);
			this.closeModal();
			this.handleItemSave(this.state.item);
			//this.setState({databaseCall: true});
		}
		//this.setState({code:result.codeResult.code, format:result.codeResult.format })
		//console.log(this.state.code)
	}

	getProductInfo = () => {
		API.getProduct(this.state.code).then(res => {
			console.log(res);
			//if(res !== "400"){
				this.setState({data: res.data, code: ""})
			//}

			// else if (res === "404"){
				// var newData = {
				// 	data: {
				// 		product:{
				// 			attributes:{
				// 				product: "Item not found. Please enter the Item details",
				// 				category_text: "",
				// 				long_desc: "",
				// 				price_new: ""
				// 			},
				// 			EAN13: this.state.data.product.EAN13,
				// 			UPCA: "",
				// 			image: ""
				// 		},
				// 		company:{
				// 			name: ""
				// 		}
				// 	}
				// }
				// this.setState({data: newData.data});
				console.log(this.state.data);
				let item = Object.assign({}, this.state.item);
					item.productName = this.state.data.product.attributes.product;
					item.companyName = this.state.data.company.name;
					item.ean = this.state.data.product.EAN13;
					item.upca = this.state.data.product.UPCA;
					item.category = this.state.data.product.attributes.category_text;
					item.desc = this.state.data.product.attributes.long_desc;
					item.price_new = this.state.data.product.attributes.price_new;
					item.image = this.state.data.product.image;
					this.setState({item});
					//this.setState({item[productName]: this.state.data.product.attributes.product})
					console.log(this.state.item);
			// }
			//else {
				//this.setState({data: "error", error: true});
				// console.log(this.state)
				// this.setState({code: "", codeInput: true})
				// var newData = {
				// 		data: {
				// 			product:{
				// 				attributes:{
				// 					product: "Item not found. Please enter the Item details",
				// 					category_text: "",
				// 					long_desc: "",
				// 					price_new: ""
				// 				},
				// 				EAN13: "",
				// 				UPCA: "",
				// 				image: ""
				// 			},
				// 			company:{
				// 				name: ""
				// 			}
				// 		}
				// 	}
				// 	this.setState({data: newData.data});
				// 	console.log(this.state.data);
				// 	let item = Object.assign({}, this.state.item);
				// 	item.productName = this.state.data.product.attributes.product;
				// 	item.companyName = this.state.data.company.name;
				// 	item.ean = this.state.data.product.EAN13;
				// 	item.upca = this.state.data.product.UPCA;
				// 	item.category = this.state.data.product.attributes.category_text;
				// 	item.desc = this.state.data.product.attributes.long_desc;
				// 	item.price_new = this.state.data.product.attributes.price_new;
				// 	item.image = this.state.data.product.image;
				// 	this.setState({item});
				// // let item = Object.assign({}, this.state.item);
				// // item.productName = this.state.data;
				// // console.log(item)
				// // this.setState({item});
				// console.log(this.state)
			//}
		})
	}

	initCameraSelection = () => {
		var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();
		return Quagga.CameraAccess.enumerateVideoDevices()
		.then(function(devices) {
			function pruneText(text) {
				return text.length > 30 ? text.substr(0, 30) : text;
			}
			var $deviceSelection = document.getElementById("deviceSelection");
			while ($deviceSelection.firstChild) {
				$deviceSelection.removeChild($deviceSelection.firstChild);
			}
			devices.forEach(function(device) {
				var $option = document.createElement("option");
				$option.value = device.deviceId || device.id;
				$option.appendChild(document.createTextNode(pruneText(device.label || device.deviceId || device.id)));
				$option.selected = streamLabel === device.label;
				$deviceSelection.appendChild($option);
			});
		})
	}

	openModal(modalType) {
		let selector = Object.assign({}, this.state.liveStreamConfig);
		this.setState({currentModal: modalType, editBeforeDatabase: false, data: "", code: ""});
		selector.inputStream.target = document.querySelector('#scanner-container');
		//resetting state
		let item = Object.assign({}, this.state.item);
		item.productName = "";
		item.companyName = "";
		item.ean = "";
		item.upca = "";
		item.category = "";
		item.desc = "";
		item.price_new = "";
		item.image = "";
		
		console.log(this.state);
		//, liveStreamConfig.inputStream.target:
	}

	handleOpenModal() {
		// references are now sync'd and can be accessed.
		//this.subtitle.style.color = '#f00';
		if(this.state.currentModal === "scanner"){
			this.startQuagga()
		}
		
		//console.log(that)
	}

	closeModal() {
		this.setState({currentModal: null, modalIsOpen: false});
	}

	render() {
		const { isAuthenticated } = this.props.auth;
		const columns = [
			{
				Header: 'Product Name',
				accessor: 'productName' // String-based value accessors!
			}, 
			{
				Header: 'Category',
				accessor: 'category',
			 // Custom cell components!
			},
			{
				Header: 'Location',
				accessor: 'location',
			 // Custom cell components!
			},
			{
				Header: 'Description',
				accessor: 'desc',
			 // Custom cell components!
			}
		]

		if (!isAuthenticated()) {
			return (
				<div>
					<h4>
						You are not logged in! Please{' '}
						<a
						style={{ cursor: 'pointer' }}
						onClick={this.login.bind(this)}
						>
					 		Log In
						</a>
						{' '}to continue.
					</h4>
				</div>
			)
		}

		return (
			<div>
				<div className = "container-fluid">
					<div className = "row buttonDiv">
						<div className="offset-md-3 col col-md-3 col-sm-6 text-center">
				  			<a data-toggle="modal" onClick={() => this.openModal(ModalType.MANUAL)} href="" id="manualBtn"><span className="glyphicon glyphicon-pencil" onClick={()=>this.logout.bind(this)}></span>Manual Entry</a>
						</div>
						<div className="col col-md-3 col-sm-6 text-center">
							<a data-toggle="modal" onClick={() => this.openModal(ModalType.SCANNER)} href="#" id="cameraBtn"><span className="glyphicon glyphicon-camera"></span>Camera Entry</a>
						</div>
			  		</div>
					<div className="row list">
						<div className ="col-sm-12 col-xs-12">
							{this.state && !this.state.savedItems ? (
								<div>
									<h1 className="list-group-item active" id="headerOne">Enter Item</h1>
								</div>
							) : ( 
								<h1 className="list-group-item active" id="headerOne">Your Items</h1>
							)}

							<div className = "row">
								<div className='col-md-10 offset-md-2'>
									{this.state && this.state.editBeforeDatabase ? (
										<form onSubmit={this.handleSubmit}>
											<div className="form-group">
												<label htmlFor="productName">Product:</label>
												<input name="productName" className="form-control" type="text" value={this.state.item.productName} onChange={this.handleManualModalChange}/>

												<label htmlFor="ean">EAN/Bar Code Number:</label>
												<input name="ean" className="form-control" type="text" value={this.state.item.ean} onChange={this.handleManualModalChange}/>

												<label htmlFor="location">Location:</label>
												<input name="location" className="form-control" type="text" value={this.state.item.location} onChange={this.handleManualModalChange}/>

												<label htmlFor="companyName">Company:</label>
												<input name="companyName" className="form-control" type="text" value={this.state.item.companyName} onChange={this.handleManualModalChange}/>

												<label htmlFor="category">Category:</label>
												<input name="category" className="form-control" type="text" value={this.state.item.category} onChange={this.handleManualModalChange}/>

												<label htmlFor="desc">Description:</label>
												<input name="desc" className="form-control" type="text" value={this.state.item.desc} onChange={this.handleManualModalChange}/>
											</div>
											<button type="submit" className="btn btn-primary">Submit</button>
										</form>
									) : (
										<div/>

									)}
								</div>
							</div>
						</div>
					</div>

					<div className = "row">
							<div className='md-12'>
								{this.state.savedItems.length ? (
									<div>
										<div className="card-columns">
											{this.state.savedItems.map(item => (
												<div key = {item._id} className = 'card'>
													<img className="card-img-top" src={item.image} alt="Card image cap"/>
													<div className="card-block">
														<h4 className="card-title">{item.productName}</h4>
														<div className="card-text">
															<div><strong>Category:</strong> {item.category}</div>
															<div><strong>Location:</strong> {item.location}</div>
															<div><strong>Description:</strong> {item.desc}</div>
											  			</div>
													</div>
													<div className="card-footer">
														<small className="text-muted">Price: {item.price_new}</small>
													</div>
												</div>
											))}
										</div>
										<ReactTable data={this.state.savedItems} columns={columns} />
									</div>

								) : (
									<h3>No Results to Display</h3>
								)}
							</div>
					</div>
					{this.renderModal()}
				</div>
			</div>
		);
	}

	renderModal() {
		switch (this.state.currentModal) {
			case ModalType.SCANNER:
				return <ScannerModal
					onAfterOpen={this.handleOpenModal}
					onClose={() => this.stopQuagga()}
					onSubmit={this.handleSubmit}
					onChange={this.handleScannerModalChange}
					code = {this.state.code}
				/>;
			case ModalType.MANUAL:
				return <ManualModal
					onAfterOpen={this.handleOpenModal}
					onClose={() => this.closeModal()}
					onChange={this.handleManualModalChange}
					onSubmit={this.handleSubmit}
					productName={this.state.item.productName}
					location={this.state.item.location}
					companyName={this.state.item.companyName}
					category={this.state.item.category}
					description={this.state.item.desc}
					ean={this.state.item.ean}
				/>;
			default:
				return null;
		}
	}
}

export default Itemize;