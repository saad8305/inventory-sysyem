import {Navigate} from 'react-router-dom';

const ProtectedRoute=({children})=>{
  const token=localStorage.getItem('access_token');
  if(!token || token==='undefined'){
    return <Navigate to="/login" replace/>;
  }
  return children;
};
export default ProtectedRoute;