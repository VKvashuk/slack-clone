import React from "react";
import { Segment, Comment } from "semantic-ui-react";
import firebase from "../../firebase/firebase";
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions'
import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";

class Messages extends React.Component {
  state = {
		privateChannel: this.props.isPrivateChannel,
		privateMessagesRef: firebase.database().ref('privateMessages'),
    messagesRef: firebase.database().ref("messages"),
    messages: [],
    messagesLoading: true,
    channel: this.props.currentChannel,
		isChannelStared: false,
    user: this.props.currentUser,
		usersRef: firebase.database().ref('users'),
    progressBar: false,
    numUniqueUsers: '',
		searchTerm: '',
		searchLoading: false,
		searchResults: ''
  };

  componentDidMount() {
    const { channel, user } = this.state;

    if (channel && user) {
      this.addListeners(channel.id);
      this.addUserStarsListener(channel.id, user.uid);
    }
  }

  addListeners = channelId => {
    this.addMessageListener(channelId);
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
		ref.child(channelId).on("child_added", snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
      this.countUserPosts(loadedMessages);
    });
  };

	addUserStarsListener = (channelId, userId) => {
		this.state.usersRef
			.child(userId)
			.child('starred')
			.once('value')
			.then(data => {
				if(data.val() !== null) {
					const channelIds = Object.keys(data.val());
					const prevStarred = channelIds.includes(channelId);
					this.setState({ isChannelStared: prevStarred })
				}
			})
	};

	getMessagesRef = () => {
		const { messagesRef, privateMessagesRef, privateChannel } = this.state;
		return privateChannel ? privateMessagesRef : messagesRef;
	};

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if(!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`;
    this.setState({ numUniqueUsers });
  };

	countUserPosts = messages => {
		let userPosts = messages.reduce((acc, message) => {
			if(message.user.name in acc) {
				acc[message.user.name].count += 1;
			} else {
				acc[message.user.name] = {
					avatar: message.user.avatar,
					count: 1
				}
			}
			return acc;
		}, {});
		this.props.setUserPosts(userPosts);
	};

  displayMessages = messages =>
    messages.length > 0 &&
    messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ));

  isProgressBarVisible = percent => {
    if (percent > 0) {
      this.setState({ progressBar: true })
    }
  };

  displayChannelName = channel => {
    return channel ? `${this.state.privateChannel ? '@' : '#'}${channel.name}` : '';
  };

	handleStar = () => {
		this.setState(prevState => ({
			isChannelStared: !prevState.isChannelStared
		}), () => this.starChannel());
	};

	starChannel = () => {
		if(this.state.isChannelStared){
			this.state.usersRef
				.child(`${this.state.user.uid}/starred`)
				.update({
					[this.state.channel.id]: {
						name: this.state.channel.name,
						details: this.state.channel.details,
						createdBy: {
							name: this.state.channel.createdBy.name,
							avatar: this.state.channel.createdBy.avatar
						}
					}
				})
		} else {
			this.state.usersRef
				.child(`${this.state.user.uid}/starred`)
				.child(this.state.channel.id)
				.remove(err => {
					if (err != null) {
						console.error(err);
					}
				})
		}
	};

  handleSearchChange = event => {
    this.setState({
      searchTerm: event.target.value,
      searchLoading: true
    }, () => this.handleSearchMessages())
  };
	handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.reduce((acc, message) => {
      if(message.content && (message.content.match(regex) || message.user.name.match(regex))) {
        acc.push(message)
      }
      return acc;
    }, []);
    this.setState({ searchResults });
    setTimeout(() => this.setState({ searchLoading: false }), 1000);
  };



  render() {
    const { messagesRef, messages, channel, user, progressBar, numUniqueUsers, searchResults, searchTerm, searchLoading, privateChannel, isChannelStared } = this.state;

    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
					handleSearchChange={this.handleSearchChange}
					searchLoading={searchLoading}
					isPrivateChannel={privateChannel}
					handleStar={this.handleStar}
					isChannelStared={isChannelStared}
        />

        <Segment>
          <Comment.Group className={progressBar ? 'messages__progress' : 'messages'}>
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
          </Comment.Group>
        </Segment>

        <MessageForm
					isPrivateChannel={privateChannel}
					getMessagesRef={this.getMessagesRef}
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isProgressBarVisible={this.isProgressBarVisible}
        />
      </React.Fragment>
    );
  }
}

export default connect(
	null,
	{ setUserPosts }
	)(Messages);