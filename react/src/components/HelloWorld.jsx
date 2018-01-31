/*
 * Copyright (c) 2017, Inversoft Inc., All Rights Reserved
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 *
 */
import React, {Component} from 'react';
import { browserHistory } from 'react-router';

const configuration = require("../../config/config.js");

class HelloWorld extends Component {
  constructor(props) {
    super(props);
    this.state = {
        userId: JSON.parse(localStorage.user).id
    };

    this.load = this.load.bind(this);
    this._handleAJAXResponse = this._handleAJAXResponse.bind(this);
    this.retrieveReg = this.retrieveReg.bind(this);
    this.update = this.update.bind(this);

  }

  componentDidMount() {
    this.load();
  }

  load() {
    this.xhr = new XMLHttpRequest();
    this.xhr.onreadystatechange = this._handleAJAXResponse;

    configuration(function(config) {
      this.setState({config: config});
      this.xhr.open('GET', config.backend.url + '/api/application', true);
      this.xhr.setRequestHeader('Authorization', 'JWT ' + localStorage.access_token);
      this.xhr.send();
    }.bind(this));
  }
  
  retrieveReg() {
    var plan = 'no plan chosen';
    fetch(this.state.config.backend.url + '/api/passport/registration/' + this.state.userId)
    .then(function(response) { return response.json(); })
    .then(
      (result) => { 
          if (result.registration.data){
              if (result.registration.data.attributes.plan) {plan = result.registration.data.attributes.plan}
          };
          
          this.setState({
              result,
              plan: plan
            });
      },
      (error) => {
        // just adding the error object to state, if it occurs
        this.setState({
          error
        });
      }
    )
  }
  
  update(plan, e) {
    e.preventDefault();
    var request = this.state.result;
    request.registration['data'] = {
      attributes: {
        plan: plan
      }  
    };    
    fetch(this.state.config.backend.url + '/api/passport/update/' + this.state.userId, {
       method: 'PUT',
       body: JSON.stringify(request), 
       headers: new Headers({
         'Content-Type': 'application/json'
       })
    }).then(res => res.json())
    .catch(error =>  this.setState({error}))
    .then(
      (response) => { 
        //console.log('Success:', response)
        this.retrieveReg();
      }
    )  
  }

  render() {
    return (
      <div>
        <h1>Chooose a Plan</h1>
        <button className="button free" onClick={this.update.bind(this,'free')}>Intro – Free</button>
        <button className="button basic" onClick={this.update.bind(this,'basic')}>Basic – $5.00</button>
        <button className="button deluxe" onClick={this.update.bind(this,'deluxe')}>Deluxe – $10.00</button>
        <h2>Your Plan</h2>
        {this.state.plan ? this.state.plan : 'loading'}
      </div>
    );
  }

  _handleAJAXResponse() {
    if (this.xhr.readyState === XMLHttpRequest.DONE) {
      if (this.xhr.status === 200) {
        const response = JSON.parse(this.xhr.responseText);
        this.setState(response);
        this.retrieveReg();
      } else if (this.xhr.status === 401 || this.xhr.status === 403) {
        // JWT is likely expired, force the user to log in again.
        browserHistory.push('/logout');
      }
    }
  }
}

export default HelloWorld;
