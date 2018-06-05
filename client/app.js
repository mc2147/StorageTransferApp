import React, {Component} from 'react'
import {Grid, Image, Header, Segment, Form, Button, Checkbox, 
    Message, Dimmer, Loader} from 'semantic-ui-react';
import axios from 'axios';
// import {Navbar} from './components'
// import Routes from './routes'


class App extends Component {
    constructor() {
        super();
        this.state = {
            provider1:'',
            provider2:'',
            auth1:false,
            auth2:false,
            accountInfo1:{
                name:'',
                email:''
            },
            accountInfo2:{
                name:'',
                email:''                
            },
            // File Lists
            fileList1:[],
            fileList2:[],
            // Folder Lists
            folderList1:[],
            folderList2:[],
            // Custom file paths
            filePath1:"",
            filePath2:"",
            // Transfer
            sourceAccount:0,
            sourceID:'',
            sourcePath:'',
            destinationAccount:0,
            destinationID:'',
            customDestinationPath:'',
            destinationPath:'',
            loading:false,
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.unlinkAccount = this.unlinkAccount.bind(this);
        this.transferSubmit = this.transferSubmit.bind(this);
    }
    async componentDidMount() {
        this.setState({
            loading:true,
        })
        let authStatusResponse = await axios.get('/api/auth-status');
        let authStatus = authStatusResponse.data;
        let blankState = {
            provider1:'', provider2:'',
            auth1:false, auth2: false,
            accountInfo1:{}, accountInfo2:{},
            fileList1:[], fileList2:[],
            folderList1:[], folderList2:[]
        }
        let {provider1, provider2, auth1, auth2, accountInfo1, accountInfo2,
        fileList1, fileList2, folderList1, folderList2} = blankState;
        // {provider1, auth1, accountInfo1, fileList1, folderList1} = authStatusResponse.data.storage
        if (authStatusResponse.data.storageAccount1) {
            provider1 = authStatusResponse.data.storageAccount1.provider;
            auth1 = authStatusResponse.data.storageAccount1.authenticated;
            accountInfo1 = authStatusResponse.data.storageAccount1.accountInfo;
            fileList1 = authStatusResponse.data.storageAccount1.fileList;
            folderList1 = authStatusResponse.data.storageAccount1.folderList;
        }
        console.log("auth-status: ", authStatusResponse.data);
        if (authStatusResponse.data.storageAccount2) {
            provider2 = authStatusResponse.data.storageAccount2.provider;
            auth2 = authStatusResponse.data.storageAccount2.authenticated;
            accountInfo2 = authStatusResponse.data.storageAccount2.accountInfo;
            fileList2 = authStatusResponse.data.storageAccount2.fileList;
            folderList2 = authStatusResponse.data.storageAccount2.folderList;
        }

        if (!fileList1) {
            fileList1 = [];
        }
        if (!folderList1) {
            folderList1 = [];
        }
        if (!accountInfo1) {
            accountInfo1 = {};
        }
        if (!fileList2) {
            fileList2 = [];
        }
        if (!folderList2) {
            folderList2 = [];
        }
        if (!accountInfo2) {
            accountInfo2 = {};
        }
        await this.setState({
            provider1,
            provider2,
            auth1,
            auth2,
            accountInfo1,
            accountInfo2,
            fileList1,
            folderList1,
            fileList2,
            folderList2,
            loading:false,
        });
        console.log("this.state: ", this.state);
        console.log("req.session: ", authStatus);
    }
    
    handleChange(e, {name, value}) {
        console.log('name: ', name);
        this.setState({[name]:value});
        // console.log("window: ", window);
        // customDestinationPath
        // window.location = 'https://www.google.com';
    }

    transferSubmit() {
        this.setState({
            loading:true,            
        })        
        let {
            sourceID,
            destinationID,
            sourceAccount,
            customDestinationPath,
        } = this.state;
        let customPath = false;
        if (customDestinationPath != '') {
            destinationID = customDestinationPath;
            customPath = true;
        }
        console.log('sourceID: ', sourceID, 'destinationID: ', destinationID);
        axios.post('/api/transfer', {sourceID, destinationID, sourceAccount, customPath}).then(response => {
            console.log('transfer response: ', response);
            this.setState({
                loading:false,            
            })        
        })
    }
    
    handleSubmit(accountNum) {
        this.setState({
            // loading:true,            
        })        
        let authPost = this.state;
        if (accountNum == 1) { //Auth for account 1
            authPost.accountNum = accountNum;            
        }
        else if (accountNum == 2) { //Auth for account 2
            authPost.accountNum = accountNum;            
        }
        const {provider1, provider2, auth1, auth2} = this.state;
        axios.post('/api/auth', authPost).then(response => {
            console.log("auth response: ", response);
            let {authURL} = response.data;
            window.open(authURL, '_self');
            this.setState({
                loading:false,            
            })                        
        })
    }

    unlinkAccount(accountNum) {
        this.setState({
            loading:true,            
        })        
        axios.put(`/api/unlink/${accountNum}`).then(response => {
            let unlinked = {};
            unlinked[`auth${accountNum}`] = false;
            unlinked[`provider${accountNum}`] = '';
            unlinked[`accountInfo${accountNum}`] = '';
            unlinked[`fileList${accountNum}`] = [];
            unlinked[`folderList${accountNum}`] = [];
            unlinked.loading = false;
            this.setState(unlinked);            
        })
    }


    render() {
        const options = [
            { key: 'drpbx', text: 'Dropbox', value: 'dropbox' },
            { key: 'gdrive', text: 'Google Drive', value: 'googledrive' },
        ]        
        const sourceAccount = [
            { key: 1, text: 'Storage Account 1', value: 1 },
            { key: 2, text: 'Storage Account 2', value: 2 },            
        ]
        console.log("this.state: ", this.state);
        const {
            provider1, provider2, 
            auth1, auth2, 
            accountInfo1, accountInfo2,
            fileList1, fileList2, 
            folderList1, folderList2,
            customDestinationPath
        } = this.state;
        console.log('fileList1: ', fileList1);
        console.log('folderList1: ', folderList1);
        let sourceOptions = [
        ];
        let destinationOptions = [
            {key:'root_dir', value:'root_dir', text:'NONE (Root Directory)'},            
        ];
        folderList1.forEach(folder => {
            if (this.state.sourceAccount == 1) {
                sourceOptions.push({
                    key:folder.tag,
                    value:folder.tag,
                    text:folder.name + ' [Folder]'
                })
            }
            else if (this.state.sourceAccount == 2) {
                destinationOptions.push({
                    key:folder.tag,
                    value:folder.tag,
                    text:folder.name 
                    // + ' [Folder]'                    
                })
            }
        });
        fileList1.forEach(file => {
            if (this.state.sourceAccount == 1) {
                sourceOptions.push({
                    key:file.tag,
                    value:file.tag,
                    text:file.name
                })
            }
            // else if (this.state.sourceAccount == 2) {
            //     destinationOptions.push({
            //         key:file.tag,
            //         value:file.tag,
            //         text:file.name
            //     })
            // }                
        });
        folderList2.forEach(folder => {
            if (this.state.sourceAccount == 2) {
                sourceOptions.push({
                    key:folder.tag,
                    value:folder.tag,
                    text:folder.name + ' [Folder]'
                })
            }
            else if (this.state.sourceAccount == 1) {
                destinationOptions.push({
                    key:folder.tag,
                    value:folder.tag,
                    text:folder.name 
                    // + ' [Folder]'                    
                })
            }
        });
        fileList2.forEach(file => {
            if (this.state.sourceAccount == 2) {
                sourceOptions.push({
                    key:file.tag,
                    value:file.tag,
                    text:file.name
                })
            }
            // else if (this.state.sourceAccount == 1) {
            //     destinationOptions.push({
            //         key:file.tag,
            //         value:file.tag,
            //         text:file.name
            //     })
            // }
        });                       
        // let file
        // <select name='sourceID' onChange={this.handleChange}>
        // {folderList1.map((folder) =>
        //     <option key={folder.tag} value={folder.tag}>{folder.name} [Folder]</option>
        // )}

        // const listItems = numbers.map((number) =>
        //     <li>{number}</li>
        // );        
        return (
          <div>
            <Dimmer active={this.state.loading} style={{'height':'150vh'}}>
                <Loader active={true}/>
            </Dimmer>
            <div className="ui inverted huge borderless fixed fluid menu">      
                <a className="header item">CFX Assessment</a>
          </div>
          <div className="ui grid">
              
            <div className="row">
              <div className="column" id="content">
                <div className="ui grid">
                  <div className="row">
                    <h1 className="ui huge header">
                      File Transfer App
                    </h1>
                  </div>
                    <Grid.Row columns={2} style={{padding:0}}>
                    <Grid.Column style={{padding:0}}>
                        <Segment>
                            <Header as='h2'>Storage Account 1</Header>                        
                            {auth1 ? (
                                <div>
                                <Message positive>
                                    <Message.Header>Authenticated!</Message.Header>
                                    <p>You are linked to the <b>{provider1}</b> account: <b>{accountInfo1.email}</b><br/><br/> 
                                    <b>Your Account Information</b>:<br/>
                                    Provider: {provider1}<br/>
                                    Name: {accountInfo1.name}<br/>
                                    Email: {accountInfo1.email}<br/>
                                    <br/>
                                    </p>
                                </Message>                                
                                <Button type='submit' negative
                                onClick={()=> this.unlinkAccount(1)}>
                                Unlink Account</Button>
                                </div>
                            ) : 
                            (
                                <div>
                                <Message negative>
                                    <Message.Header>No Linked Account</Message.Header>
                                    <p>You have not linked an account.<br/> 
                                    Please select a storage provider from the list and click 'Link Account' to link your storage account!</p>
                                </Message>
                                <Form onSubmit={() => this.handleSubmit(1)}>
                                    <Form.Select placeholder='Select Storage Provider' options={options} 
                                    name='provider1'
                                    onChange={this.handleChange}
                                    />
                                    <Button type='submit' primary>Link Storage Account 1</Button>
                                </Form>                            
                                </div>    
                            )}
                        </Segment>
                    </Grid.Column>
                    <Grid.Column style={{padding:0}}>
                        <Segment>
                            <Header as='h2'>Storage Account 2</Header>                        
                            {auth2 ? (
                                <div>
                                <Message positive>
                                    <Message.Header>Authenticated!</Message.Header>
                                    <p>You are linked to the <b>{provider2}</b> account: <b>{accountInfo2.email}</b><br/><br/> 
                                    <b>Your Account Information</b>:<br/>
                                    Provider: {provider2}<br/>
                                    Name: {accountInfo2.name}<br/>
                                    Email: {accountInfo2.email}<br/>
                                    <br/>
                                    </p>
                                </Message>                                
                                <Button type='submit' negative
                                onClick={()=> this.unlinkAccount(2)}>
                                Unlink Account</Button>
                                </div>
                            ) : 
                            (
                                <div>
                                <Message negative>
                                    <Message.Header>Not Authenticated</Message.Header>
                                    <p>You have not yet authenticated an account.<br/> 
                                    Please select a storage provider from the list and click 'Authenticate' to link your storage account!</p>
                                </Message>
                                <Form onSubmit={() => this.handleSubmit(2)}>
                                    <Form.Select placeholder='Select Storage Provider' options={options} 
                                    name='provider2'
                                    onChange={this.handleChange}
                                    />
                                    
                                    <Button type='submit' primary>Link Account</Button>
                                </Form>                            
                                </div>    
                            )}
                        </Segment>
                    </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1} style={{padding:0}}>
                         <Grid.Column style={{padding:0}}>
                         <Segment.Group style={{margin:'auto'}} textAlign='center'>
                         <Form onSubmit={this.transferSubmit} textAlign='center'>
                            <Segment style={{margin:0}}> 
                            <Header as='h2' textAlign='center'>File Transfer</Header>                        
                            <Message negative>
                                <Message.Header>Two Linked Accounts Required</Message.Header>
                                <p>Please link Storage Account 1 & Storage Account 2 to copy files.<br/> 
                                Please select a storage provider from the list and click 'Authenticate' to link your storage account!</p>
                            </Message>
                                <label><b>Select Source Account</b></label>
                                <Form.Select placeholder='Select Source Account' options={sourceAccount} 
                                name='sourceAccount'
                                onChange={this.handleChange}
                                style={{marginTop:"5px"}}/>
                                <Form.Field>
                                <label>Select Source File or Folder
                                {(this.state.sourceAccount != 0) ? (<b>{` (Storage Account ${this.state.sourceAccount})`}</b>) 
                                : null
                                }
                                </label>
                                {(this.state.sourceAccount != 0) ? 
                                    (
                                    <Form.Select 
                                    placeholder='Select Source File or Folder' 
                                    options={sourceOptions} 
                                    name='sourceID'
                                    onChange={this.handleChange}
                                    style={{marginTop:"5px"}}/>
                                    ) 
                                    :
                                    null
                                } 

                                </Form.Field>
                        </Segment>               
                            <Segment.Group horizontal style={{margin:0}}>
                                <Segment>
                                    <Form.Field>
                                    <label>Select Destination Folder
                                    {
                                    //     (this.state.sourceAccount != 0) ? 
                                    // (<b>{` (Storage Account ${this.state.sourceAccount})`}</b>) 
                                    // : null
                                    }                                    
                                    </label>
                                    {(this.state.sourceAccount != 0) ? 
                                        (
                                        <Form.Select 
                                        placeholder='Select Source File or Folder' 
                                        options={destinationOptions} 
                                        name='destinationID'
                                        onChange={this.handleChange}
                                        disabled={customDestinationPath != ''}
                                        style={{marginTop:"5px"}}/>
                                        ) 
                                        :
                                        null
                                    } 
                                    <b>OR enter a custom directory</b>
                                        
                                    <Form.Input placeholder='Enter custom directory' name='customDestinationPath' 
                                    value={customDestinationPath} onChange={this.handleChange} 
                                    style={{marginTop:'5px'}}/>                                    

                                    </Form.Field>
                                </Segment>
                            </Segment.Group>
                            </Form>             
                            <Segment textAlign='center'>
                            <Button type='submit' className="center" positive style={{margin:'auto'}}
                            onClick={this.transferSubmit}>Transfer File</Button>                                
                            </Segment>
                        </Segment.Group>                            
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={2}>
                    </Grid.Row>                    
                </div>
              </div>
            </div>
          </div>
          </div>
        )
      }
    }

export default App
