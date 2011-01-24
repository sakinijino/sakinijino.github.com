private void SelectedImage_ImageOpened(object sender, RoutedEventArgs e)
{
  if (!StopSlideshow) {
    ShowMainImage.Begin(); 
  } else { 
    ShowForSelected.Begin();
  } 
} 

