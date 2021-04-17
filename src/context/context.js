import React, { useState, useEffect, createContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

/*Creating a context provider*/
const GithubContext = createContext();

/*Context Provider*/
const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState(mockUser);
	const [repos, setRepos] = useState(mockRepos);
	const [followers, setFollowers] = useState(mockFollowers);
	// request loading
	const [requests, setRequests] = useState(0);
	const [loading, setLoading] = useState(false);
	//error
	const [error, setError] = useState({ show: false, msg: '' });

	const searchGithubUser = async (user) => {
		toggleError();
		setLoading(true);
		//set loading
		const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
			console.log(err)
		);
		if (response) {
			setGithubUser(response.data);
			const { login, followers_url } = response.data;
			//Promise.allSettled - used tp get all the responses at once
			await Promise.allSettled([
				axios(`${rootUrl}/users/${login}/repos?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					console.log(results);
					const [repos, followers] = results;
					console.log(repos);
					console.log(followers);
					const status = 'fulfilled';
					if (repos.status === status) {
						setRepos(repos.value.data);
					}
					if (followers.status === status) {
						setFollowers(followers.value.data);
					}
				})
				.catch((err) => console.log(err));
		} else {
			toggleError(true, 'there is no user with this username');
		}
		checkRequests();
		setLoading(false);
	};

	/* Check rate */
	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`)
			.then((data) => {
				let {
					rate: { remaining },
				} = data.data;
				setRequests(remaining);
				if (remaining === 0) {
					//throw error
					toggleError(true, 'Sorry, you have exceeded your hourly rate limit!');
				}
			})
			.catch((err) => console.log(err));
	};
	function toggleError(show = false, msg = '') {
		setError({ show, msg });
	}

	useEffect(() => {
		checkRequests();
	}, []);

	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				requests,
				error,
				searchGithubUser,
				loading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};

export { GithubProvider, GithubContext };
