import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {Router} from 'react-router-dom'
// import history from './history'
// import store from './store'
import App from './app'

// establishes socket connection
// import './socket'

ReactDOM.render(
    // <div>
    //     React Test
    // </div>
    //   <Provider>
    //     <Router>
    //     </Router>
    //   </Provider>
    <App />
    ,
    document.getElementById('main')
)
