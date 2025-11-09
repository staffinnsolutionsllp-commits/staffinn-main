/* eslint-disable no-unused-vars */
import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'
import { assets } from '../../assets/assets'
const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className="footer-content">
            <div className="footer-content-left">
                <img src={assets.Logo} alt="" />
                <p>Staffinn is a comprehensive platform connecting skilled professionals, educational institutes, and recruiters. We bridge the gap between talent and opportunity through innovative technology, providing seamless recruitment solutions and career development resources for the modern workforce.</p>
                <div className="footer-social-icons">
                    <img src={assets.facebook_icon} alt="" />
                    <img src={assets.twitter_icon} alt="" />
                    <img src={assets.linkedin_icon} alt="" />
                </div>
            </div>
            <div className="footer-content-center">
                <h2>COMPANY</h2>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/staff">Staff</Link></li>
                    <li><Link to="/recruiter">Recruiter</Link></li>
                    <li><Link to="/institute">Institute</Link></li>
                    <li><Link to="/news">News</Link></li>
                    <li>Privacy policy</li>
                </ul>
            </div>
            <div className="footer-content-right">
               <h2>GET IN TOUCH</h2>
               <ul>
                <li>+1-212-456-7890</li>
                <li>staffinnsolutionsllp@gmail.com</li>
               </ul>
            </div>
        </div>    
        <hr />
        <p className="footer-copyright"> Copyright 2025 © Staffinn.com - All Right Reserved. </p> 
    </div>
  )
}

export default Footer
