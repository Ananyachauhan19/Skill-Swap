import axios from 'axios';
import { BACKEND_URL } from '../config';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // send cookie to api.skillswaphub.in
});

export default api;