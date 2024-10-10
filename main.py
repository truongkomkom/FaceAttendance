from flask import Flask, render_template, Response
import cv2
import pandas as pd
from deepface import DeepFace
from tracker import Tracker
# Khởi tạo Flask
app = Flask(__name__)
tracker = Tracker()
# Khởi tạo DeepSort tracker và mở camera sử dụng OpenCV
camera = cv2.VideoCapture(0)
list_face = []

# Hàm xác minh khuôn mặt
def verify(image):
    # Đường dẫn tới file cơ sở dữ liệu face embeddings
    file_path = r"database\face_embeddings.pkl"

    # Đọc file .pkl
    data = pd.read_pickle(file_path)
    results = pd.DataFrame(data)

    # Trích xuất đặc trưng khuôn mặt từ ảnh
    embedding_objs = DeepFace.represent(
        img_path=image, model_name='ArcFace', detector_backend='opencv',
        anti_spoofing=True, align=True, max_faces=1, enforce_detection=False
    )

    if not embedding_objs:
        return "Unknown", None, 0

    bbox = embedding_objs[0]['facial_area']
    target_embedding = embedding_objs[0]['embedding']
    confidence = embedding_objs[0]['face_confidence']
    distances = []
    target_threshold = 0.6  # Ngưỡng khoảng cách cho việc nhận diện
    # Tính khoảng cách giữa target và tất cả các khuôn mặt trong cơ sở dữ liệu
    for _, instance in results.iterrows():
        source_representation = instance["embedding"]
        distance = DeepFace.verification.find_distance(
            alpha_embedding=source_representation, beta_embedding=target_embedding, distance_metric="cosine"
        )
        distances.append(distance)

    results["distance"] = distances
    results = results.sort_values(by=["distance"], ascending=True)

    # Trả về kết quả nhận diện
    if results['distance'].iloc[0] <= target_threshold:
        return results['mssv'].iloc[0], bbox, confidence
    else:
        return "Unknown", bbox, confidence


# Hàm phát video từ camera
def gen_frames():
    while True:
        success, frame = camera.read()  # Đọc frame từ camera

        if not success:
            break

        try:
            # Xác minh khuôn mặt
            class_id, bbox, confidence = verify(frame)

            if bbox is not None:
                # Lấy tọa độ bbox và chuẩn bị dữ liệu đầu vào cho tracker
                xmin, ymin = int(bbox['x']), int(bbox['y'])
                xmax, ymax = int(bbox['x'] + bbox['w']), int(bbox['y'] + bbox['h'])



                cv2.putText(frame, str(class_id), (xmin + 5, ymin - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
                cv2.rectangle(frame, (xmin, ymin - 20), (xmin + 20, ymin), (0, 255, 0), -1)

            # Chuyển frame thành dạng byte để truyền đi
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            # Trả về frame dưới dạng byte
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

        except Exception as e:
            print(f"An error occurred during frame processing: {e}")


# Route cho trang chủ để phát video
@app.route('/')
def index():
    return render_template('index.html')


# Route phát video từ camera
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    app.run(debug=False, use_reloader=False)
