import React, { useState, useEffect } from "react";
import { useApi } from '../../api';
import { useNavigate } from 'react-router-dom';
import "./style.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faUser, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { SignOutBox } from "../../components/SignOutBox";

const DesktopManageAccounts = () => {
    const { apiFetch } = useApi();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [editedRoles, setEditedRoles] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [filterOption, setFilterOption] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sign-out dialog
    const [isOpen, setIsOpen] = useState(false);
    const [userName, setUserName] = useState({ firstName: "User", lastName: "Name" });

    // Save confirmation dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaveConfirmed, setIsSaveConfirmed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUserName(JSON.parse(stored));
    }, []);

    const toggleDialog = () => setIsOpen(!isOpen);

    // Fetch accounts
    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/accounts');
            const data = await res.json();
            setAccounts(data.accounts || []);
            const initial = {};
            (data.accounts || []).forEach(acc => initial[acc.email] = acc.role);
            setEditedRoles(initial);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load accounts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    // Edit / Save roles
    const toggleEdit = async () => {
        if (isEditing) {
            try {
                const res = await apiFetch('/api/update-roles', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                    body: JSON.stringify(editedRoles)
                });
                const result = await res.json();
                if (result.status === 'success') {
                    setAccounts(accounts.map(a => ({ ...a, role: editedRoles[a.email] })));
                    setIsSaveConfirmed(true);
                    setIsDialogOpen(true);
                    setTimeout(() => { setIsSaveConfirmed(false); setIsDialogOpen(false); setIsEditing(false); }, 3000);
                }
            } catch (err) { console.error(err); }
        } else setIsEditing(true);
    };

    // Delete account
    const handleDelete = async email => {
        if (!window.confirm(`Delete ${email}?`)) return;
        try {
            const res = await apiFetch('/api/delete-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email }) });
            const result = await res.json();
            if (result.status === 'success') fetchAccounts();
        } catch (err) { console.error(err); }
    };

    // Filters
    const applyFilter = acc => {
        if (filterOption === 'Admins') return acc.role === 'Admin';
        if (filterOption === 'Employees') return acc.role === 'Employee';
        if (filterOption === 'Recent') {
            const created = new Date(acc.createdAt || acc.created_at);
            return created >= new Date(Date.now() - 7 * 86400000);
        }
        return true;
    };

    const filtered = accounts.filter(applyFilter).filter(acc => {
        const q = searchQuery.toLowerCase();
        return (acc.firstName || acc.firstname || '').toLowerCase().includes(q)
            || (acc.lastName || acc.lastname || '').toLowerCase().includes(q);
    });

    return (
        <div className="desktop-data">
            <div className="navbar">
                <div className="header-controls">
                    <select className="filter-dropdown" value={filterOption} onChange={e => setFilterOption(e.target.value)}>
                        <option value="All">All</option>
                        <option value="Admins">Admins</option>
                        <option value="Employees">Employees</option>
                        <option value="Recent">Created Last 7 Days</option>
                    </select>
                    <input type="text" className="search-bar" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <button type="button" className="frame-7" onClick={fetchAccounts}><FontAwesomeIcon icon={faSyncAlt} /></button>
                    <div className="frame-7" onClick={toggleEdit}><div className="text-wrapper-7">{isEditing ? 'Save' : 'Edit'}</div></div>
                    <div className="frame-7" onClick={() => navigate('/adminpage')}><div className="text-wrapper-7">Inventory</div></div>
                    <FontAwesomeIcon icon={faUser} className="user-icon" size="lg" onClick={toggleDialog} />
                </div>
            </div>

            <div className={`sign-out-container ${isOpen ? 'show' : ''}`} style={{ display: isOpen ? 'block' : 'none', pointerEvents: isOpen ? 'auto' : 'none' }}>
                <SignOutBox firstName={userName.firstName} lastName={userName.lastName} />
            </div>

            <div className="hero">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="header-cell"><div className="text-wrapper">Email</div></th>
                            <th className="header-cell"><div className="text-wrapper">First Name</div></th>
                            <th className="header-cell"><div className="text-wrapper">Last Name</div></th>
                            <th className="header-cell"><div className="text-wrapper">Role</div></th>
                            {isEditing && <th className="header-cell"><div className="text-wrapper">Action</div></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={isEditing ? 5 : 4}>Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={isEditing ? 5 : 4}>No accounts found.</td></tr>
                        ) : filtered.map((acc, idx) => (
                            <tr key={idx}>
                                <td className="item-cell"><div className="div">{acc.email}</div></td>
                                <td className="item-cell"><div className="div">{acc.firstName || acc.firstname}</div></td>
                                <td className="item-cell"><div className="div">{acc.lastName || acc.lastname}</div></td>
                                <td className="item-cell">
                                    {isEditing ? (
                                        <select value={editedRoles[acc.email] ?? acc.role} onChange={e => setEditedRoles({ ...editedRoles, [acc.email]: e.target.value })}>
                                            <option value="Admin">Admin</option>
                                            <option value="Employee">Employee</option>
                                        </select>
                                    ) : (<div className="div">{acc.role}</div>)}
                                </td>
                                {isEditing && (
                                    <td className="item-cell">
                                        <button type="button" className="delete-btn" onClick={() => handleDelete(acc.email)}>
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isDialogOpen && (
                <div className="dialog-overlay"><div className="dialog-box">
                    {isSaveConfirmed && (<><div className="checkmark">✔</div><p className="success-message">Your changes have been saved.</p></>)}
                </div></div>
            )}

            <footer className="footer">
                <div className="div-wrapper"><div className="text-wrapper-2">aptitude</div></div>
                <div className="frame-2"><div className="frame-3"><div className="text-wrapper-3">Aptitude</div></div><div className="frame-4"><div className="home-log-in-sign-up">
                    <a href='/'>Home</a>
                    <br />
                    <a href='/login'>Log In</a>
                    <br />
                    <a href='/register'>Sign Up</a>
                </div></div></div>
                <div className="frame-5"><div className="frame-3"><div className="text-wrapper-4">Contact</div></div><div className="frame-4"><div className="email-website">Email<br />Website<br />Instagram</div></div></div>
                <div className="frame-5"><div className="frame-4"><div className="text-wrapper-5">Help</div></div><div className="frame-3"><div className="support-FAQ">Support<br />FAQ</div></div></div>
            </footer>
        </div>
    );
};

export default DesktopManageAccounts;
