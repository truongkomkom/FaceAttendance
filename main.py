from flask import Flask, render_template, session, Response, jsonify,request, redirect, url_for, flash

import pandas as pd
from deepface import DeepFace
from deep_sort_realtime.deepsort_tracker import DeepSort
import firebase_admin
from firebase_admin import credentials, storage
import cv2
import secrets

cred = credentials.Certificate('private_key/faceattendacerealtime-1b299-firebase-adminsdk-rm4dk-4815594a23.json')

firebase_admin.initialize_app(cred, {
    'storageBucket': 'faceattendacerealtime-1b299.appspot.com'  # Tên bucket
})
bucket = storage.bucket()

tracker = DeepSort(max_age=15, n_init=3, nms_max_overlap=1.0)

# Khởi tạo Flask
app = Flask(__name__)
from flask_cors import CORS
CORS(app)
app.secret_key = secrets.token_hex(16)
# Khởi tạo DeepSort tracker và mở camera sử dụng OpenCV
camera = cv2.VideoCapture(0)

# Biến toàn cục để lưu thông tin nhận diện khuôn mặt
info_data = None

# Hàm xác minh khuôn mặt
def verify(image):
    # Đường dẫn tới file cơ sở dữ liệu face embeddings
    file_path = r"database\21DTHX.json"
    # Đọc file .pkl
    data = pd.read_json(file_path)
    results = pd.DataFrame(data)

    # Trích xuất đặc trưng khuôn mặt từ ảnh
    embedding_objs = DeepFace.represent(
        img_path=image, model_name='ArcFace', detector_backend='opencv',
        anti_spoofing=True, align=True, max_faces=1, enforce_detection=False
    )
    if not embedding_objs:
        return "Unknown","Unknown", None, 0

    bbox = embedding_objs[0]['facial_area']
    target_embedding = embedding_objs[0]['embedding']
    confidence = embedding_objs[0]['face_confidence']
    distances = []
    target_threshold = 0.8  # Ngưỡng khoảng cách cho việc nhận diện
    # Tính khoảng cách giữa target và tất cả các khuôn mặt trong cơ sở dữ liệu
    for _, instance in results.iterrows():
        source_representation = instance["embedding"]
        distance = DeepFace.verification.find_distance(
            alpha_embedding=source_representation, beta_embedding=target_embedding, distance_metric="cosine"
        )
        distances.append(distance)

    results["distance"] = distances
    results = results.sort_values(by=["distance"], ascending=True)
    results = results.head(5).mode()
    # Trả về kết quả nhận diện
    if results['distance'].iloc[0] <= target_threshold:
        return results['mssv'].iloc[0], results['name'].iloc[0], bbox, confidence
    else:
        return "Unknown", "Unknown", bbox, confidence


# Hàm phát video từ camera
def gen_frames():
    global info_data  # Sử dụng biến toàn cục info_data
    while True:
        success, frame = camera.read()  # Đọc frame từ camera
        detections = []
        # Kiểm tra nếu thành công trong việc đọc frame
        if not success:
            print("Không thể đọc frame từ camera.")
            break

        try:
            # Xác minh khuôn mặt và nhận diện bbox
            mssv, name, bbox, confidence = verify(frame)

            if bbox is not None and name != "Unknown":
                # blob = bucket.blob(f'21DTHX/{mssv}/2{''}')

                # Lấy tọa độ bbox và chuẩn bị dữ liệu đầu vào cho tracker
                bbox_tracker = list(map(int, [bbox['x'], bbox['y'], bbox['w'], bbox['h']]))
                score = float(confidence)
                detections.append((bbox_tracker, score, name))

                # Cập nhật theo dõi đối tượng
                tracked_objects = tracker.update_tracks(detections, frame=frame)

                # Vẽ bounding box cho các đối tượng đã được theo dõi
                for track in tracked_objects:
                    if track.is_confirmed() and track.time_since_update <= 1:
                        ltrb = track.to_ltrb()  # Bounding box format [left, top, right, bottom]

                        # Draw rectangle
                        cv2.rectangle(frame, (int(ltrb[0]), int(ltrb[1])), (int(ltrb[2]), int(ltrb[3])), (200, 100, 100 ), 2)

                        # Define text background color and position
                        (text_width, text_height), baseline = cv2.getTextSize(name, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
                        background_topleft = (int(ltrb[0]), int(ltrb[1]) - text_height - 10)
                        background_bottomright = (int(ltrb[0]) + text_width, int(ltrb[1]))

                        # Draw filled rectangle for background
                        cv2.rectangle(frame, background_topleft, background_bottomright, (255, 0, 0), -1)

                        # Draw text on top of the background
                        cv2.putText(frame, name, (int(ltrb[0]), int(ltrb[1]) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                                    (255, 255, 255), 2)

                        ret, buffer = cv2.imencode('.jpg', frame)
                        frame_bytes = buffer.tobytes()
                        if not ret:
                            continue
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                        info_data = {
                            "mssv": str(int(mssv)),
                            "name": name,
                        }

            else:
                ret, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                if not ret:
                    continue
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


        except Exception as e:
            print(f"Đã xảy ra lỗi trong quá trình xử lý frame: {e}")

SAMPLE_ACCOUNT = {
    'email': 'admin@gmail.com',
    'password': '123456'
}

#

@app.route('/', methods=['GET'])
def index():
    # Kiểm tra đăng nhập
    if session.get('logged_in'):
        return redirect(url_for('main_page'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    if email == SAMPLE_ACCOUNT['email'] and password == SAMPLE_ACCOUNT['password']:
        session['logged_in'] = True
        session['email'] = email
        session['active'] = True  # Thêm flag hoạt động
        return redirect(url_for('main_page'))
    else:
        flash('Invalid email or password! Please try again.', 'error')
        return redirect(url_for('index'))

@app.route('/main_page')
def main_page():
    # Kiểm tra session chi tiết hơn
    if not session.get('logged_in') or not session.get('active'):
        flash('Vui lòng đăng nhập lại', 'error')
        return redirect(url_for('index'))
    return render_template('main.html')

@app.route('/class_page')
def class_page():
    # Kiểm tra session chi tiết hơn
    if not session.get('logged_in') or not session.get('active'):
        flash('Vui lòng đăng nhập lại', 'error')
        return redirect(url_for('index'))
    return render_template('class.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('email', None)
    session.pop('active', None)
    session.clear()
    session.modified = True

    return redirect(url_for('index'))


# Route phát video từ camera
@app.route('/video_feed')
def video_feed():
    # Kiểm tra session
    if not session.get('logged_in') or not session.get('active'):
        return "Unauthorized", 401  # Trả về lỗi 401 nếu chưa đăng nhập
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/info_data')
def get_info_data():
    # Kiểm tra session
    if not session.get('logged_in') or not session.get('active'):
        return jsonify({"error": "Unauthorized"}), 401  # Trả về lỗi 401 nếu chưa đăng nhập

    global info_data
    return jsonify(info_data)

@app.route('/classDetail/<class_id>')
def class_detail(class_id):
    return render_template('classDetail.html', class_id=class_id)
if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
