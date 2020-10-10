import React, {Component} from "react";

type HomeProps = {};
type HomeState = {
  error: null | string,
  isLoaded: boolean,
  currentPolls: Array<any>
}
class Home extends Component<HomeProps, HomeState>{
  constructor(props:HomeProps) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      currentPolls: []
    };
  }
  componentDidMount() {
    fetch("http://localhost:5000/api/getCurrentPolls")
      .then(res => res.json())
      .then((result) => {
        this.setState({
          isLoaded: true,
          currentPolls: result
        });
      },
      (error) => {
        this.setState({
          isLoaded: true,
          error
        });
      });
  }
  render() {
    const {error, isLoaded, currentPolls} = this.state;
    // const title = () =>( <div>Welcome to CSH Vote!</div>);

    if (error) {
      return(
      <div>Something went wrong! Please Try again</div>
      );
    } else if(!isLoaded) {
      return(<div>Loading...</div>)
    }else {
      return(
      <div>
      <ul>
      {currentPolls.map(currentPoll => (
        <li key={currentPoll.name}>
          {currentPoll.name}
        </li>
      ))}
    </ul>
    </div>
      )}
  }
}

export default Home;
