import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    install('google-auth')
    install('google-api-python-client')
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

import datetime

def test_sheet():
    print("Starting test...")
    client_email = "lovenest-bot@lovenest-orders.iam.gserviceaccount.com"
    private_key = """-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCuaaM39kyDf+ZU
4xtEbaC5lHpN+yr7yUS34rUDmpZhWcmt1GTAvr6yMqsnybR/C9ddaQdWRIGsAOlm
fv0xAhepMpF+r/wjPnVHrMHXqSH6+yQMKJ1ogYJ8sW/phywMJqn97xb+DgAmaVVU
54pflyoLlzKIJStcIgM84hc1UrmnrElVj29k50utKn5qrpgB4FMSlk/5qgOTp/Yd
0+Tb+fZ4BLsPADx4hUpZi+8jz7NQ8ge7ilcgttouR9i01x603E6F7qqOWjX2tCkv
ct4bUCEnzP2O7iyssYF2gKrYF3b8wehbb8OJyCO+9Oa3RkajpvWwLuEuw1eD86xP
vg5xcZrnAgMBAAECggEABH5bQq9ZVFAAxrIdOzuZ1v4w0n6Eon0ShKxWHpQmiLaQ
ACcHO4IOlrfAeiNzv4w2DcWNd1cHgj95w/bEnjUgF+9iGUH+fIf47JJSYjSM2BMN
YDTRrWYczwqhSAKAC4YZfh3hWUVSEqtHFAttIL5bynWoSyKuBc8ohzKKB4ksmFnI
lHIR4LgpGc3djU84YWpCSeAewexBl6BQLlA3aIHlKduCWoFvIBRBYbQrwDKtdMyy
RG+xb+hLWb4VQhFITJ6xZjuMoDqnKBb62UVPQvXFN0oGHNZx3wfIAEgjt2DPu7LF
aCao1Tjoa8zYDxBiKS/Zuqj2XF3gMbxikRPP9CRNWQKBgQDj/icYtAf2JP9fkv/F
Y5tu0TffnfCCkin7ckzUSM6WYKMWS7tAKxCYANLa0/JjeypBLPoRNMivvZPsZdY7
Xe24mcR+sxkIzdvsRb7lBTZpZOkvSYj+PnY6Ph4LjWrJIfI8BYExBPyfDoGSRFRs
IWFckb2LH4zlutG3OSrI2mkPzwKBgQDD1oNaSSmm9DLMfVsG+vW3405saOm2/4kT
g/jRPf4EU58qthx8HG1GBlAX+HhQSxs6mOEaPdewFQ/z3dFNLkz2XDcUdzkVF4o9
76ryc0MoU1dtG4qFw5EppV/RUlOqNup+LlnECeAdtj9ZAuktblU6IZj6471LtrMU
7suED9SxaQKBgQCkwD2ETmQKbMXVTKZi/w2M0MbtYnYwBGst9nSqWkpexEpVjDgt
sHD3RnEYDFx1osTwAA5cbKYwyG+iPhzHHaLw6LzjSYxnnkqzu9qsKE4fbvpKX3sN
LhnFEKopcvGdklg3I0suHwpl7deX2KSg1qZCfFZZuFzajVuKaVcPeTS+ZQKBgD37
OJtsqHgktacuzY6KAxbuJDX/hmjau4GntSpUWn74EFouRRmqzZLqEJNlmn6fJsEG
/ceWZxtdryzZuZKZ4tXeHbimezSHvMMZhZsyi8DJj9QCcXcgjGMH6imPytcGhnTl
Kpf3IC2HLsl3OGGel+7MD2Toi1LZQhiP822arRBxAoGBALCI+tCc/OyiqZ6tgOD7
yPPzHoJRkFxojrncP3P6z4C7+yIYGzHKVFq3Zd6Y04V1p89g1VhpICm0J0HbJz1X
2uJYW0f/rHkN03MQncv7esxvtSgo43nz0CTXrsPpZ0WAl+hwNIcO/Q7A+szSW8Ae
KqqYejTKAcTLR/G7lQkwf/31
-----END PRIVATE KEY-----\n"""
    
    sheet_id = "19lo3B7TQPiFYRETg7ReiW1MOWM6GRR0I"

    try:
        credentials = service_account.Credentials.from_service_account_info({
            "client_email": client_email,
            "private_key": private_key,
            "token_uri": "https://oauth2.googleapis.com/token"
        }, scopes=['https://www.googleapis.com/auth/spreadsheets'])

        service = build('sheets', 'v4', credentials=credentials)
        sheet = service.spreadsheets()
        
        print("Fetching spreadsheet info...")
        result = sheet.get(spreadsheetId=sheet_id).execute()
        
        first_sheet_title = result.get('sheets', [])[0].get('properties', {}).get('title', 'Sheet1')
        print(f"First sheet title is: {first_sheet_title}")
        range_name = f"'{first_sheet_title}'!A:K"

        row_data = [
            datetime.datetime.now().isoformat(),
            "#TEST_PY",
            "Test Python",
            "123",
            "City",
            "Addr",
            "Item 1",
            "Cash",
            "50",
            "Success",
            "None"
        ]

        print(f"Attempting append to {range_name}...")
        body = {
            'values': [row_data]
        }
        result = sheet.values().append(
            spreadsheetId=sheet_id, range=range_name,
            valueInputOption='USER_ENTERED', body=body).execute()
        
        print(f"Success!!! {result.get('updates', {}).get('updatedCells')} cells appended.")

    except Exception as e:
        print(f"DEBUG Failed: {e}")

test_sheet()
