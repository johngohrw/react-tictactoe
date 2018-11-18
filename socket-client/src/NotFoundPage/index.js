import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Button } from 'reactstrap';
import './notFoundPage.css'

export default class NotFoundPage extends Component {
  render() {
    return (
      
      <div className="not-found-page">
        <Container>
          <Row>
            <h1>You f'ed up!</h1>
          </Row>
          <Row>
            404 Page Not Found
          </Row>
          <Row>
            <Link to="/"><Button>Back to home</Button></Link>
          </Row>
        </Container>
      </div>
    );
  }
}