
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Class Detail</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}" />
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white text-[16px] font-mono">
    <div class="w-full max-w-[1300px] xl:mx-auto h-screen justify-between">
        <div class="fixed w-full h-[56px] flex justify-between items-center max-w-[1300px] px-[40px] xl:px-0">
            <div class="text-[40px] leading-[42px] font-bold">LOGO</div>
            <div class="flex text-[22px] leading-[24px] font-bold gap-[12px]">
                <a href="{{ url_for('main_page') }}" class="inline-block px-[12px]">Home</a>
                <a href="{{ url_for('class_page') }}" class="px-[12px]">Class</a>
                <a href="{{ url_for('index') }}">Login</a>
            </div>
        </div>
        <div class="pt-[72px] w-full px-[40px] xl:px-0">
            <table class="w-full">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="p-[12px] text-left">STT</th>
                        <th class="p-[12px] text-left">Ảnh</th>
                        <th class="p-[12px] text-left">MSSV</th>
                        <th class="p-[12px] text-left">Lớp</th>
                        <th class="p-[12px] text-left">Họ và tên</th>
                        <th class="p-[12px] text-left w-[270px]">Điểm danh</th>
                    </tr>
                </thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
    </div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
        import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

        const firebaseConfig = {
            apiKey: "AIzaSyBWTzzUlA2YkBq9lCpUHn1q_K6Z8TCvB7k",
            authDomain: "faceattendacerealtime-1b299.firebaseapp.com",
            databaseURL: "https://faceattendacerealtime-1b299-default-rtdb.firebaseio.com",
            projectId: "faceattendacerealtime-1b299",
            storageBucket: "faceattendacerealtime-1b299.appspot.com",
            messagingSenderId: "760810463873",
            appId: "1:760810463873:web:3bac3fdde876f4955de380",
            measurementId: "G-NZDZ7Q4Y8P"
        };

        // Khởi tạo Firebase
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        const storage = getStorage(app);

        // Cache để lưu trạng thái checkbox
        const checkboxStates = new Map();

        // Hàm lấy URL ảnh sinh viên
        async function getStudentImageUrl(mssv) {
            try {
                const imagePath = `21DTHX/${mssv}/1.png`;
                const imageRef = storageRef(storage, imagePath);
                return await getDownloadURL(imageRef);
            } catch {
                return "/static/asset/yae-miko-genshin-impact-anime-video-game-wallpaper-2880x1800_8.jpg";
            }
        }

        // Hàm cập nhật điểm danh
        async function updateAttendance() {
            try {
                const response = await fetch('/info_data');
                if (response.status === 401) {
                    window.location.href = '/index';
                    return;
                }
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                console.log('Received attendance data:', data);

                // Kiểm tra dữ liệu hợp lệ
                if (!data || !data.mssv) {
                    console.log('No valid attendance data received');
                    return;
                }

                // Tìm và cập nhật checkbox cho MSSV
                const checkbox = document.querySelector(`input[data-mssv="${data.mssv}"]`);
                if (checkbox) {
                    // Chỉ cập nhật nếu checkbox chưa được check
                    if (!checkbox.checked) {
                        checkbox.checked = true;
                        checkboxStates.set(data.mssv, true);

                        // Highlight hàng được check
                        const row = checkbox.closest('tr');
                        if (row) {
                            // Thêm class transition để animation mượt mà
                            row.style.transition = 'background-color 0.3s ease';
                            row.style.backgroundColor = '#374151';

                            // Hiển thị thông báo điểm danh thành công
                            const nameCell = row.querySelector('td:nth-child(5)'); // Cột họ tên
                            const originalColor = nameCell.style.color;
                            nameCell.style.color = '#4ADE80'; // Màu xanh lá
                            nameCell.textContent = `${data.name} (Đã điểm danh)`;

                            // Tự động reset sau 2 giây
                            setTimeout(() => {
                                row.style.backgroundColor = '';
                                nameCell.style.color = originalColor;
                                nameCell.textContent = data.name;
                            }, 2000);
                        }

                        // Log để debug
                        console.log(`Checked attendance for student ${data.mssv} - ${data.name}`);
                    }
                } else {
                    console.warn(`Checkbox not found for student ${data.mssv}`);
                }
            } catch (error) {
                console.error('Error updating attendance:', error);
                console.log('Error details:', error.message);
            }
        }

        // Hàm xử lý sự kiện thay đổi checkbox
        function handleCheckboxChange(event) {
            const mssv = event.target.dataset.mssv;
            const isChecked = event.target.checked;
            console.log(`Checkbox changed for MSSV ${mssv}: ${isChecked}`);
            checkboxStates.set(mssv, isChecked);
        }

        // Hàm render danh sách sinh viên
        async function renderStudents(studentsData) {
            const tableBodyEl = document.getElementById("tableBody");
            if (!tableBodyEl) return;

            const studentList = await Promise.all(
                Object.entries(studentsData).map(async ([mssv, student]) => {
                    const avatarUrl = await getStudentImageUrl(mssv);
                    return {
                        mssv,
                        name: student.name || "Không có tên",
                        class: student.class || "Chưa có lớp",
                        avatar: avatarUrl
                    };
                })
            );

            // Sắp xếp theo MSSV
            studentList.sort((a, b) => a.mssv.localeCompare(b.mssv));
            tableBodyEl.innerHTML = '';

            // Render từng hàng sinh viên
            studentList.forEach((data, index) => {
                const row = `
                    <tr class="border-b border-gray-700 hover:bg-gray-800" data-row-id="${data.mssv}">
                        <td class="p-[12px]">${index + 1}</td>
                        <td class="p-[12px]">
                            <img
                                src="${data.avatar}"
                                alt="${data.name}"
                                class="w-[64px] h-[64px] rounded-full object-cover mx-auto"
                                onerror="this.src='/static/asset/yae-miko-genshin-impact-anime-video-game-wallpaper-2880x1800_8.jpg'"/>
                        </td>
                        <td class="p-[12px]">${data.mssv}</td>
                        <td class="p-[12px]">${data.class}</td>
                        <td class="p-[12px]">${data.name}</td>
                        <td class="p-[12px]">
                            <input
                                type="checkbox"
                                class="attendance-checkbox w-5 h-5 cursor-pointer"
                                data-mssv="${data.mssv}"
                                ${checkboxStates.get(data.mssv) ? 'checked' : ''} />
                        </td>
                    </tr>
                `;
                tableBodyEl.insertAdjacentHTML("beforeend", row);
            });

            // Thêm event listeners cho checkboxes
            document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', handleCheckboxChange);
            });
        }

        // Hàm khởi tạo lắng nghe dữ liệu
        function initializeDataListener() {
            const tableBodyEl = document.getElementById("tableBody");
            tableBodyEl.innerHTML = '<tr><td colspan="6" class="text-center p-4">Đang tải dữ liệu...</td></tr>';

            // Thiết lập interval cho việc cập nhật attendance
            setInterval(updateAttendance, 2000);

            // Lắng nghe thay đổi từ Firebase
            const studentsRef = ref(database, 'students');
            onValue(studentsRef, (snapshot) => {
                if (snapshot.exists()) {
                    renderStudents(snapshot.val());
                } else {
                    tableBodyEl.innerHTML = '<tr><td colspan="6" class="text-center p-4">Không có dữ liệu sinh viên</td></tr>';
                }
            });
        }

        // Khởi tạo ứng dụng khi DOM đã sẵn sàng
        document.addEventListener('DOMContentLoaded', initializeDataListener);
    </script>
</body>
</html>