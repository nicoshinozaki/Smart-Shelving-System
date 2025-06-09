import React, { useState, useEffect } from 'react';
import { ArrowRight } from "../../components/ArrowRight";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { SignOutBox } from "../../components/SignOutBox";
import { useApi } from '../../api';

function DesktopInventoryData() {
	const { apiFetch } = useApi();
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTag, setSelectedTag] = useState("All");
	const [userName, setUserName] = useState({ firstName: "User", lastName: "Name" });
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("default");
	const [inventoryData, setInventoryData] = useState([]);
	const [loading, setLoading] = useState(true);

	// Toggle the sign-out dialog
	const toggleDialog = () => setIsOpen(!isOpen);

	// Load stored user name
	useEffect(() => {
		const stored = localStorage.getItem('user');
		if (stored) setUserName(JSON.parse(stored));
	}, []);

	// Fetch & map sheet data
	const fetchSheetData = async () => {
		console.log("♻️ refresh clicked");
		setLoading(true);
		try {
			const response = await apiFetch("/api/sheets-data");
			const data = await response.json();

			if (data.values && data.values.length > 1) {
				const [headers, ...rows] = data.values;
				const mapped = rows.map(row => {
					const item = {};
					headers.forEach((h, i) => {
						const key = h.toLowerCase();
						if (key.includes("drawer number")) item.productName = row[i];
						else if (key.includes("item number")) item.partNumber = row[i];
						else if (key.includes("inventory amount")) item.inventoryAmount = Number(row[i]);
					});
					return item;
				});

				const withTags = mapped.map(item => ({
					...item,
					tags:
						item.productName && item.productName.includes("Resistor")
							? "Electronics"
							: item.productName && item.productName.includes("Test Tubes")
								? "Chemicals"
								: "Hardware",
				}));

				setInventoryData(withTags);
			} else {
				setInventoryData([]);
			}
		} catch (err) {
			console.error("Error fetching sheet data:", err);
			setInventoryData([]);
		} finally {
			setLoading(false);
		}
	};

	// Initial load on mount
	useEffect(() => {
		fetchSheetData();
	}, []);

	// Auto-refresh every 5 minutes
	useEffect(() => {
		const intervalId = setInterval(() => {
			console.log("♻️ auto-refresh");
			fetchSheetData();
		}, 5 * 60 * 1000);
		return () => clearInterval(intervalId);
	}, []);

	// Filter & sort logic
	const filtered = inventoryData.filter(item =>
		(selectedTag === "All" || item.tags === selectedTag) &&
		(item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()))
	);
	const sorted = [...filtered].sort((a, b) => {
		if (sortOption === "lowToHigh") return a.inventoryAmount - b.inventoryAmount;
		if (sortOption === "highToLow") return b.inventoryAmount - a.inventoryAmount;
		return 0;
	});

	return (
		<div className="desktop-data">
			<div className="frame">
				<div className="navbar">
					<img className="img" alt="Frame" src="/img/frame-55.png" />
					<div className="header-controls">
						<select
							className="sort-dropdown"
							value={sortOption}
							onChange={e => setSortOption(e.target.value)}
						>
							<option value="default">Sort By</option>
							<option value="lowToHigh">Item Count: Low to High</option>
							<option value="highToLow">Item Count: High to Low</option>
						</select>

						<select
							className="filter-dropdown"
							value={selectedTag}
							onChange={e => setSelectedTag(e.target.value)}
						>
							<option value="All">Filter</option>
							<option value="Electronics">Electronics</option>
							<option value="Chemicals">Chemicals</option>
							<option value="Hardware">Hardware</option>
						</select>

						<input
							type="text"
							className="search-bar"
							placeholder="Search..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>

						<FontAwesomeIcon
							icon={faUser}
							className="user-icon"
							size="lg"
							onClick={toggleDialog}
						/>
					</div>
				</div>

				<div className="hero">
					<div
						className={`sign-out-container ${isOpen ? "show" : ""}`}
						style={{ display: isOpen ? 'block' : 'none', pointerEvents: isOpen ? 'auto' : 'none' }}
					>
						<SignOutBox firstName={userName.firstName} lastName={userName.lastName} />
					</div>

					<table className="table">
						<thead>
							<tr>
								<th colSpan="3" style={{
									background: 'transparent', borderLeft: 'none',
									borderRight: 'none', borderBottom: 'none'
								}}></th>
								<th
									className="header-cell"
									style={{
										background: 'transparent', borderLeft: 'none',
										borderRight: 'none', borderBottom: 'none'
									}}
								>
									<button
										type="button"
										className="refresh-button"
										onClick={fetchSheetData}
										title="Refresh data"
										style={{
											backgroundColor: '#fff',
											border: '1px solid #ddd',
											borderRadius: '4px',
											padding: '0.5rem',
											color: '#000',
											cursor: 'pointer'
										}}
									>
										<FontAwesomeIcon icon={faSyncAlt} />
									</button>
								</th>
							</tr>
							<tr>
								<th className="header-cell"><div className="text-wrapper">Product Name</div></th>
								<th className="header-cell"><div className="text-wrapper">Part Number</div></th>
								<th className="header-cell"><div className="text-wrapper">Amount in Inventory</div></th>
								<th className="header-cell"><div className="text-wrapper">Activity</div></th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan="4">Loading...</td></tr>
							) : !inventoryData.length ? (
								<tr><td colSpan="4">No data found.</td></tr>
							) : (
								sorted.map((item, idx) => (
									<tr key={idx}>
										<td className="item-cell"><div className="div">{item.productName}</div></td>
										<td className="item-cell"><div className="div">{item.partNumber}</div></td>
										<td className="item-cell"><div className="div">{item.inventoryAmount}</div></td>
										<td className="arrow-right-wrapper">
											<div className="arrow-container">
												<ArrowRight img="/img/arrow-right.png" size="forty-eight" />
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<footer className="footer">
					<div className="div-wrapper"><div className="text-wrapper-2">aptitude</div></div>
					<div className="frame-2">
						<div className="frame-3"><div className="text-wrapper-3">Aptitude</div></div>
						<div className="frame-4"><div className="home-log-in-sign-up">
							<a href='/'>Home</a>
							<br />
							<a href='/login'>Log In</a>
							<br />
							<a href='/register'>Sign Up</a></div></div>
					</div>
					<div className="frame-5">
						<div className="frame-3"><div className="text-wrapper-4">Contact</div></div>
						<div className="frame-4"><div className="email-website">Email<br />Website<br />Instagram</div></div>
					</div>
					<div className="frame-5">
						<div className="frame-4"><div className="text-wrapper-5">Help</div></div>
						<div className="frame-3"><div className="support-FAQ">Support<br />FAQ</div></div>
					</div>
				</footer>

				<div className="ellipse" />
				<img className="ellipse-2" alt="Ellipse" src="/img/ellipse-2.png" />
			</div>
			<img className="rectangle" alt="Rectangle" src="/img/rectangle-21.png" />
		</div>
	);
}

export default DesktopInventoryData;
